import { API_URL } from "../config.js";

export class ChatError extends Error {
  constructor(message, kind) {
    super(message);
    this.kind = kind; // "network" | "http" | "invalid"
  }
}

/**
 * Sends a question to the FastAPI backend and streams the answer.
 * Yields text chunks as they arrive.
 * Throws a ChatError with a message safe to show a visitor; the original
 * error is always logged to the console for debugging.
 */
export async function* askQuestionStream(question) {
  let response;
  try {
    response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
  } catch (err) {
    console.error("AskUtkarsh: network error calling /chat", err);
    throw new ChatError(
      "I couldn't connect to the portfolio backend. Please try again.",
      "network"
    );
  }

  if (!response.ok) {
    console.error("AskUtkarsh: /chat returned HTTP", response.status);
    throw new ChatError(
      "The portfolio backend ran into a problem answering that. Please try again.",
      "http"
    );
  }

  // Stream the response text
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        yield chunk;
      }
    }
  } catch (err) {
    console.error("AskUtkarsh: error reading stream", err);
    throw new ChatError(
      "Connection lost while receiving the answer. Please try again.",
      "network"
    );
  }
}

/**
 * Legacy non-streaming version for backward compatibility.
 * Collects all streamed chunks and returns the full answer.
 */
export async function askQuestion(question) {
  let fullAnswer = "";

  try {
    for await (const chunk of askQuestionStream(question)) {
      fullAnswer += chunk;
    }
  } catch (err) {
    if (err instanceof ChatError) {
      throw err;
    }
    console.error("AskUtkarsh: unexpected error", err);
    throw new ChatError(
      "Something went wrong. Please try again.",
      "invalid"
    );
  }

  if (!fullAnswer.trim()) {
    console.error("AskUtkarsh: empty answer received");
    throw new ChatError(
      "I didn't get a real answer back that time. Please try again.",
      "invalid"
    );
  }

  return fullAnswer;
}
