import { useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

const MAX_HEIGHT_PX = 160;
const DEBOUNCE_DELAY_MS = 300; // Prevent double-sends within 300ms

export default function ChatInput({ onSend, isLoading }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);
  const lastSendTimeRef = useRef(0);

  const resizeTextarea = (el) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  };

  const handleChange = (event) => {
    setValue(event.target.value);
    resizeTextarea(event.target);
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    // Debounce: prevent sending the same message twice within DEBOUNCE_DELAY_MS
    const now = Date.now();
    if (now - lastSendTimeRef.current < DEBOUNCE_DELAY_MS) {
      return;
    }
    lastSendTimeRef.current = now;

    onSend(trimmed);
    setValue("");
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
    // Esc to clear (when not loading)
    if (event.key === "Escape" && !isLoading && value.trim()) {
      setValue("");
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      });
    }
  };

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div className={`chat-input ${isLoading ? "chat-input--loading" : ""}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask about my projects, skills, or experience…"
        rows={1}
        aria-label="Ask AskUtkarsh a question"
        disabled={isLoading}
      />
      <button
        type="button"
        className="chat-input__send"
        onClick={submit}
        disabled={!canSend}
        aria-label="Send question"
      >
        <ArrowUp size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
