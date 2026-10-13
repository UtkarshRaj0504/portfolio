import { Briefcase, Code2, GraduationCap, Mail, Download } from "lucide-react";
import { QUICK_ACTIONS, RESUME_PATH } from "../config.js";

const ICONS = {
  projects: Briefcase,
  skills: Code2,
  education: GraduationCap,
  contact: Mail,
};

export default function QuickActions({ onSelect, disabled }) {
  return (
    <div className="quick-actions">
      {QUICK_ACTIONS.map((action) => {
        const Icon = ICONS[action.id];
        return (
          <button
            key={action.id}
            type="button"
            className="quick-actions__button"
            onClick={() => onSelect(action.prompt)}
            disabled={disabled}
          >
            <Icon size={16} strokeWidth={1.75} />
            {action.label}
          </button>
        );
      })}

      <a
        href={RESUME_PATH}
        download
        className="quick-actions__button quick-actions__button--resume"
      >
        <Download size={16} strokeWidth={1.75} />
        Download Resume
      </a>
    </div>
  );
}
