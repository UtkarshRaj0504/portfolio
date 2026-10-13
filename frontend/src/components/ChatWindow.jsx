import { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import MessageBubble from "./MessageBubble.jsx";

export default function ChatWindow({ messages, isLoading, error, onClear }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isLoading]);

  return (
    <>
      <div className="chat-window" role="log" aria-live="polite">
        {messages.map((message, index) => (
          <MessageBubble key={index} role={message.role} content={message.content} />
        ))}

        {isLoading && (
          <div className="message message--assistant message--thinking">
            <span className="message__author">AskUtkarsh</span>
            <p className="message__content message__content--thinking">
              <span>thinking</span>
              <span className="thinking-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </p>
          </div>
        )}

        {error && (
          <div className="chat-error" role="alert">
            {error}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {messages.length > 0 && (
        <button
          className="chat-clear"
          onClick={onClear}
          disabled={isLoading}
          aria-label="Clear conversation"
          title="Clear conversation history"
        >
          <RotateCcw size={16} />
          <span>Clear</span>
        </button>
      )}
    </>
  );
}
