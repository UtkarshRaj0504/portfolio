import ReactMarkdown from "react-markdown";

export default function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`message ${isUser ? "message--user" : "message--assistant"}`}>
      <span className="message__author">{isUser ? "You" : "AskUtkarsh"}</span>
      <div className="message__content">
        {isUser ? <p>{content}</p> : <ReactMarkdown>{content}</ReactMarkdown>}
      </div>
    </div>
  );
}
