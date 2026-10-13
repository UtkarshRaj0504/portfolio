import { Github } from "lucide-react";
import { SITE } from "../config.js";

export default function Header() {
  return (
    <header className="app-header">
      <span className="app-header__mark">{SITE.name}</span>
      {SITE.githubUrl && (
        <a
          href={SITE.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="app-header__link"
          aria-label="View source on GitHub"
        >
          <Github size={18} strokeWidth={1.75} />
        </a>
      )}
    </header>
  );
}
