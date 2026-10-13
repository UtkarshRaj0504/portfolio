import json
import os
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi import FastAPI, HTTPException
import logging

from dotenv import load_dotenv
from groq import Groq
from pydantic import BaseModel
from pypdf import PdfReader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
my_api_key = os.getenv("groq_apikey")
if not my_api_key:
    raise ValueError("api key not found")


_client = None

def get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=my_api_key)
    return _client


model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
resume_path = os.getenv("RESUME_PATH", "my_resume.pdf")
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5174,http://127.0.0.1:5174").split(",")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


_resume_cache = None

class Experience(BaseModel):
    company: str | None = None
    role: str | None = None
    duration: str | None = None
    description: str | None = None
    skills_used: list[str] = []

class Resume(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    total_experience_years: float | None = None
    skills: list[str] = []
    experiences: list[Experience] = []
    education: list[str] = []
    projects: list[str] = []
    certifications: list[str] = []

resume_schema = Resume.model_json_schema()

class ChatRequest(BaseModel):
    question: str

def ask_candidate_stream(question: str, resume: Resume):
    """Stream response from LLM about the candidate. Returns generator yielding text chunks."""
    # Store the original resume text in memory for context
    resume_json = resume.model_dump_json(indent=2)

    system_prompt = f"""You are an AI assistant representing a job candidate. Your role is to answer questions about this candidate as if you are them or speaking on their behalf.

CANDIDATE INFORMATION (Structured):
{resume_json}

CRITICAL INSTRUCTIONS:

1. **Answer Comprehensively**: Provide detailed, thorough answers. Always use ALL relevant information available. Do not be brief or minimal.

2. **Search Thoroughly**: When asked about anything (project, skill, experience):
   - Look through ALL projects, experiences, skills carefully
   - If you find relevant information, provide COMPLETE details
   - Include technologies, outcomes, achievements, descriptions
   - If it's a follow-up question, provide EVEN MORE detail

3. **Answer Only from Resume**: Never make up information. Only state what's in the candidate data above.

4. **Handle Follow-ups**:
   - If asked "give more details", provide deeper information
   - Do NOT say "I don't have information" if it was in your previous answers
   - Provide specific technologies, achievements, metrics, outcomes
   - Elaborate and expand on previous information

5. **Key Projects to Reference**:
   - PlateStock: AI Inventory Management for Institutional Kitchens (FastAPI, PostgreSQL, React, TypeScript)
   - Look for all project details, technologies, features

6. **Professional Tone**: Answer as if in an HR interview.

7. **Formatting**:
   - Use bullet points (-) for lists
   - Use **bold** for project/company names
   - Use paragraphs for detailed explanations
   - No headings

Remember: If asked about a project like PlateStock or any experience, provide ALL available details about it.
"""
    try:
        client = get_client()
        stream = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            stream=True
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    except Exception as e:
        logger.error(f"Error streaming response: {e}")
        yield f"Error: {str(e)}"
def parse_resume(resume_text):
    """Parse resume text into Resume object using LLM. Includes error handling."""
    system_prompt = f"""You are an expert resume parser with exceptional attention to detail.

Extract ALL information from the resume comprehensively. Do not miss any details.

Different resumes may use different section headings:
- Experience / Professional Experience / Work History / Employment / Internships
- Projects / Portfolio / Portfolio Projects / Key Projects / Notable Work
- Skills / Technical Skills / Competencies / Technologies
- Education / Educational Background / Qualifications
- Certifications / Credentials / Licenses

IMPORTANT: Extract COMPLETE information for each section:
- For projects: Include project name, description, technologies used, duration, outcomes, and any links
- For experiences: Include company, role, all responsibilities, achievements, technologies, dates
- For skills: List ALL skills mentioned across entire resume (in projects, experience, education)
- For education: Include institution, degree, field, graduation date, relevant coursework
- For certifications: Include certification name, issuer, date, any relevant details

Return ONLY valid JSON matching this schema:

{resume_schema}

CRITICAL RULES:

1. Extract ALL information - be thorough, not minimal
2. Do not invent information - only use what's in the resume
3. If a value is not available, return null
4. If a list has no information, return an empty list
5. Include internships inside experiences
6. Extract skills mentioned across the ENTIRE resume (skills section, projects, experience, education)
7. For projects and experiences, include complete descriptions with details
8. If information is split across multiple places, consolidate it
"""
    user_prompt = f"""Parse the following resume THOROUGHLY and COMPLETELY:

{resume_text}
"""
    try:
        client = get_client()
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        raw_output = response.choices[0].message.content
        data = json.loads(raw_output)
        resume = Resume(**data)
        logger.info("Resume parsed successfully")
        logger.info(f"Parsed {len(resume.projects)} projects, {len(resume.experiences)} experiences, {len(resume.skills)} skills")
        return resume
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        raise ValueError("Could not parse resume. Invalid JSON from LLM.")
    except Exception as e:
        logger.error(f"Error parsing resume: {e}")
        raise


def read_pdf(file_path: Path):
    """Read and extract text from PDF file with error handling."""
    try:
        if not file_path.exists():
            raise FileNotFoundError(f"Resume file not found: {file_path}")

        reader = PdfReader(file_path)
        text = ""

        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

        if not text.strip():
            raise ValueError("Could not extract text from PDF")

        logger.info(f"Successfully read PDF: {file_path}")
        return text
    except Exception as e:
        logger.error(f"Error reading PDF: {e}")
        raise

def get_cached_resume():
    """Get resume from cache or load and cache it."""
    global _resume_cache
    try:
        if _resume_cache is None:
            logger.info("Loading resume from disk and caching...")
            resume_text = read_pdf(Path(resume_path))
            _resume_cache = parse_resume(resume_text)
            logger.info("Resume cached successfully")
        return _resume_cache
    except Exception as e:
        logger.error(f"Error loading resume: {e}")
        raise

@app.get("/")
def home():
    return {"message": "AskUtkarsh portfolio backend is running"}

@app.get("/health")
def health():
    """Health check endpoint."""
    try:
        resume = get_cached_resume()
        return {
            "status": "healthy",
            "candidate": resume.name or "Unknown"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }, 500

@app.post("/reload")
def reload_resume():
    """Force reload the resume from disk."""
    global _resume_cache
    try:
        _resume_cache = None
        resume = get_cached_resume()
        logger.info("Resume reloaded successfully")
        return {
            "status": "reloaded",
            "candidate": resume.name or "Unknown"
        }
    except Exception as e:
        logger.error(f"Error reloading resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def chat(request: ChatRequest):
    """Stream chat response about the candidate."""
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        resume = get_cached_resume()
        logger.info(f"Answering question: {request.question[:100]}...")

        def generate():
            try:
                for chunk in ask_candidate_stream(request.question, resume):
                    yield chunk
            except Exception as e:
                logger.error(f"Error during streaming: {e}")
                yield f"\n\nError: {str(e)}"

        return StreamingResponse(generate(), media_type="text/event-stream")
    except FileNotFoundError as e:
        logger.error(f"Resume not found: {e}")
        raise HTTPException(status_code=404, detail="Resume not found")
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
