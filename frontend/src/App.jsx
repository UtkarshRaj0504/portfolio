import { useState, useEffect } from "react";
import Header from "./components/Header.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import ChatInput from "./components/ChatInput.jsx";
import QuickActions from "./components/QuickActions.jsx";
import { askQuestionStream, ChatError } from "./api/chat.js";
import { SITE } from "./config.js";
import "./App.css";

const STORAGE_KEY = "askutkarsh_messages";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
      }
    } catch (err) {
      console.error("Failed to load messages from localStorage", err);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.error("Failed to save messages to localStorage", err);
    }
  }, [messages]);

  const hasStartedChatting = messages.length > 0;

  const handleSend = async (question) => {
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsLoading(true);

    try {
      let answer = "";

      // Stream the response and accumulate it
      for await (const chunk of askQuestionStream(question)) {
        answer += chunk;
        // Update the last message (assistant message) in real-time
        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1]?.role === "assistant") {
            newMessages[newMessages.length - 1].content = answer;
          } else {
            newMessages.push({ role: "assistant", content: answer });
          }
          return newMessages;
        });
      }
    } catch (err) {
      if (err instanceof ChatError) {
        setError(err.message);
      } else {
        console.error("AskUtkarsh: unexpected error", err);
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="app">
      <div
        className={`background-wash ${hasStartedChatting ? "background-wash--subtle" : ""}`}
        aria-hidden="true"
      />
      <div className="background-grain" aria-hidden="true" />

      <div className="app__foreground">
        <Header />

        <main className={`app__main ${hasStartedChatting ? "app__main--chat" : "app__main--landing"}`}>
          {!hasStartedChatting && (
            <div className="landing">
              <h1 className="landing__title">{SITE.name}</h1>
              <p className="landing__tagline">{SITE.tagline}</p>
              <p className="landing__subtext">{SITE.subtext}</p>
            </div>
          )}

          {hasStartedChatting && (
            <ChatWindow messages={messages} isLoading={isLoading} error={error} onClear={handleClear} />
          )}

          <div className="app__composer">
            <ChatInput onSend={handleSend} isLoading={isLoading} />
            <QuickActions onSelect={handleSend} disabled={isLoading} />
          </div>
        </main>
      </div>
    </div>
  );
}
