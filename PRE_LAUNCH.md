# 🚀 Pre-Production Checklist

## ✅ Core Functionality
- [x] Backend caching working (resume parsed once, cached)
- [x] Response streaming working (text appears real-time)
- [x] Error handling in place (logging enabled)
- [x] localStorage persistence working (chat history survives refresh)
- [x] Keyboard shortcuts working (Enter=send, Esc=clear)
- [x] Health check endpoint `/health` working
- [x] Reload endpoint `/reload` working

---

## 🔐 Security - CRITICAL BEFORE GOING LIVE

### Backend Security
- [ ] **Remove/Rotate API Key**: Your Groq API key is in `.env` (good, but ensure it's NOT committed)
  - Current status: ✅ `.gitignore` excludes `.env`
  - Action: Never commit `.env`, use `.env.example` as template

- [ ] **Rate Limiting**: Add rate limiting to prevent API abuse
  - Without it: Someone could spam `/chat` and drain your Groq credits
  - Recommendation: Use `slowapi` library
  ```bash
  pip install slowapi
  ```

- [ ] **CORS Hardening**: Currently allows all methods
  - Current: `allow_methods=["*"]`
  - Recommendation for production:
  ```python
  allow_methods=["GET", "POST", "OPTIONS"]
  allow_headers=["Content-Type"]
  ```

- [ ] **Input Validation**: Add length limits to questions
  ```python
  if len(request.question) > 2000:
      raise HTTPException(status_code=400, detail="Question too long")
  ```

- [ ] **API Key Security**: Use environment-only, never hardcode
  - Current: ✅ Using `os.getenv()`
  - Action: Ensure production server has `groq_apikey` set as environment variable

### Frontend Security
- [ ] **CSP Headers**: Ensure backend sends Content-Security-Policy headers
- [ ] **HTTPS**: Use HTTPS in production (not HTTP)
- [ ] **Sanitize User Input**: Already good with React's auto-escaping

---

## 💰 Cost Control

### Groq API Costs
- [ ] **Monitor Usage**: Set up billing alerts
- [ ] **Rate Limit**: Implement limits to control costs
  - Without limits: Malicious users could run up your bill
  - Recommendation: 10-20 requests/minute per IP

- [ ] **Model Choice**: Currently using `openai/gpt-oss-120b`
  - This is a large model → more expensive
  - Consider faster/cheaper alternatives if budget matters

---

## 📝 Configuration

### Backend `.env` for Production
```bash
# Production .env should have:
groq_apikey=sk-xxxxxxxxxxxxx
GROQ_MODEL=openai/gpt-oss-120b
RESUME_PATH=/path/to/resume.pdf
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Frontend `.env` for Production
```bash
VITE_API_URL=https://your-backend-domain.com
```

---

## 🌐 Deployment Recommendations

### Option 1: Easy (Recommended for start)
- **Frontend**: Vercel (free tier available)
- **Backend**: Railway, Render, or Heroku (free tier limited)
- **Resume**: Store in backend directory or cloud storage

### Option 2: Professional
- **Frontend**: Netlify or AWS CloudFront
- **Backend**: AWS EC2, DigitalOcean, or Render
- **Resume**: AWS S3 or Google Cloud Storage

### Option 3: Simple Free Alternative
- **Frontend**: GitHub Pages
- **Backend**: Render (free tier, sleeps after 15 min inactivity)
- **Resume**: GitHub repo

---

## 🎯 Recommended Changes Before Live

### HIGH PRIORITY (Must Do)
1. ✅ **Add Rate Limiting**
   ```python
   from slowapi import Limiter
   from slowapi.util import get_remote_address
   
   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   
   @app.post("/chat")
   @limiter.limit("20/minute")
   def chat(request: ChatRequest):
       ...
   ```

2. ✅ **Add Input Validation**
   ```python
   if not request.question.strip() or len(request.question) > 2000:
       raise HTTPException(status_code=400, detail="Invalid question")
   ```

3. ✅ **Tighten CORS**
   ```python
   cors_origins = os.getenv("CORS_ORIGINS", "").split(",")
   if not cors_origins or cors_origins == [""] :
       cors_origins = ["https://yourdomain.com"]  # Default to your domain
   ```

### MEDIUM PRIORITY (Should Do)
4. **Add logging to file** (not just console)
   ```python
   logging.basicConfig(
       level=logging.INFO,
       filename="portfolio.log",
       format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
   )
   ```

5. **Add request timeout**
   ```python
   client = Groq(api_key=my_api_key, timeout=30.0)
   ```

6. **Add error tracking** (Sentry, LogRocket, etc.)

### LOW PRIORITY (Nice to Have)
7. **Add caching headers** for frontend assets
8. **Add analytics** (Google Analytics, Plausible)
9. **Add uptime monitoring** (UptimeRobot)
10. **Add feedback form** (Typeform, Userbit)

---

## 📋 Pre-Launch Checklist

- [ ] Test on actual device (phone, tablet)
- [ ] Test with slow internet (DevTools → Throttle)
- [ ] Test error scenarios (stop backend, test error handling)
- [ ] Test mobile responsiveness
- [ ] Test keyboard accessibility
- [ ] Verify all links work
- [ ] Test offline behavior (should show friendly error)
- [ ] Verify resume displays correctly
- [ ] Test chat history persistence
- [ ] Load test (can it handle 10 concurrent users?)

---

## 🔧 Quick Implementation - Rate Limiting

Add this to `backend/main.py`:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/chat")
@limiter.limit("20/minute")  # 20 requests per minute per IP
def chat(request: ChatRequest):
    # ... existing code
```

Install: `pip install slowapi`

---

## 🚀 Final Recommendation

**BEFORE GOING LIVE, implement:**
1. Rate limiting (prevents abuse)
2. Input validation (prevents crashes)
3. Tighter CORS (only your domain)
4. Production .env setup (API key security)

**Timeline**: 30 minutes to implement all 4

**After Launch**:
- Monitor logs for errors
- Set up uptime monitoring
- Gather user feedback
- Optimize based on usage

---

## Quick Deploy Steps

### 1. Backend (Railway/Render)
```bash
# Create railway/render project
# Connect your GitHub repo
# Add environment variables (GROQ_MODEL, groq_apikey, CORS_ORIGINS)
# Deploy
```

### 2. Frontend (Vercel)
```bash
# Connect GitHub repo
# Set VITE_API_URL to your backend URL
# Deploy
```

### 3. Resume Management
- Keep `my_resume.pdf` in backend repo, or
- Use `/reload` endpoint to refresh when updated

---

**Want me to implement the 4 critical changes now?** I can add them in 15 minutes!
