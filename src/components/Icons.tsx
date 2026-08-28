interface IP {
  className?: string;
}

const S = ({ className = "w-4 h-4", children }: IP & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

/* Зірка Qwen */
export const Star = ({ className = "w-6 h-6" }: IP) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <path
      d="M16 3.5l2.9 8.6 8.6 2.9-8.6 2.9L16 26.5l-2.9-8.6-8.6-2.9 8.6-2.9z"
      fill="url(#qg)"
    />
    <defs>
      <linearGradient id="qg" x1="4" y1="4" x2="28" y2="28">
        <stop offset="0" stopColor="#8b7cff" />
        <stop offset="1" stopColor="#615ced" />
      </linearGradient>
    </defs>
  </svg>
);

export const SendIcon = (p: IP) => (
  <S {...p}>
    <path d="M4.5 12L3 4.5c0-.6.6-1 1.1-.8l16.3 7.4c.5.2.5.9 0 1.1L4.1 19.6c-.5.2-1.1-.2-1.1-.8z" />
    <path d="M4.5 12H12" />
  </S>
);

export const PlusIcon = (p: IP) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);

export const TrashIcon = (p: IP) => (
  <S {...p}>
    <path d="M4 7h16M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.5 7l1 12a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l1-12" />
    <path d="M10 11v6M14 11v6" />
  </S>
);

export const CopyIcon = (p: IP) => (
  <S {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 3h9A1.5 1.5 0 0 1 14.5 4.5V5" />
  </S>
);

export const CheckIcon = (p: IP) => (
  <S {...p}>
    <path d="M4.5 12.5l5 5L19.5 6.5" />
  </S>
);

export const StopIcon = (p: IP) => (
  <S {...p}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />
  </S>
);

export const ChevronDown = (p: IP) => (
  <S {...p}>
    <path d="M6 9.5l6 6 6-6" />
  </S>
);

export const GearIcon = (p: IP) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19 12a7 7 0 0 0-.15-1.4l2-1.55-2-3.46-2.35.95a7 7 0 0 0-2.42-1.4L13.7 2.6h-3.4l-.38 2.54a7 7 0 0 0-2.42 1.4l-2.35-.95-2 3.46 2 1.55a7 7 0 0 1 0 2.8l-2 1.55 2 3.46 2.35-.95a7 7 0 0 0 2.42 1.4l.38 2.54h3.4l.38-2.54a7 7 0 0 0 2.42-1.4l2.35.95 2-3.46-2-1.55c.1-.45.15-.92.15-1.4z" />
  </S>
);

export const PaperclipIcon = (p: IP) => (
  <S {...p}>
    <path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L10 17a1.7 1.7 0 0 1-2.4-2.4l7.4-7.4" />
  </S>
);

export const CodeIcon = (p: IP) => (
  <S {...p}>
    <path d="M8 6.5L2.5 12 8 17.5M16 6.5l5.5 5.5L16 17.5" />
  </S>
);

export const EyeIcon = (p: IP) => (
  <S {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </S>
);

export const TerminalIcon = (p: IP) => (
  <S {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 9l3.5 3L7 15M12.5 15.5H17" />
  </S>
);

export const RefreshIcon = (p: IP) => (
  <S {...p}>
    <path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3" />
    <path d="M4.5 4v4h4M19.5 20v-4h-4" />
  </S>
);

export const GlobeIcon = (p: IP) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5S14.5 18.2 12 20.5c-2.5-2.3-3.8-5.2-3.8-8.5S9.5 5.8 12 3.5z" />
  </S>
);

export const BrainIcon = (p: IP) => (
  <S {...p}>
    <path d="M9.5 4A2.5 2.5 0 0 0 7 6.5c-1.7.3-3 1.8-3 3.6 0 1 .4 1.9 1 2.6-.6.7-1 1.6-1 2.6A3.7 3.7 0 0 0 7.7 19c.4 1.2 1.5 2 2.8 2 1 0 1.9-.5 2.5-1.2V6.2A2.5 2.5 0 0 0 9.5 4zM14.5 4A2.5 2.5 0 0 1 17 6.5c1.7.3 3 1.8 3 3.6 0 1-.4 1.9-1 2.6.6.7 1 1.6 1 2.6a3.7 3.7 0 0 1-3.7 3.7c-.4 1.2-1.5 2-2.8 2-1 0-1.9-.5-2.5-1.2V6.2A2.5 2.5 0 0 1 14.5 4z" />
  </S>
);

export const XIcon = (p: IP) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </S>
);

export const FolderIcon = (p: IP) => (
  <S {...p}>
    <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.5h8A1.5 1.5 0 0 1 20.5 9v9A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18z" />
  </S>
);

export const FileIcon = (p: IP) => (
  <S {...p}>
    <path d="M6 3.5h8L19 8.5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" />
    <path d="M13.5 3.5v5.5H19" />
  </S>
);

export const SearchIcon = (p: IP) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-3.8-3.8" />
  </S>
);

export const BulbIcon = (p: IP) => (
  <S {...p}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 3.6 10.8c-.7.6-1.1 1.3-1.3 2.2h-4.6c-.2-.9-.6-1.6-1.3-2.2A6 6 0 0 1 12 3z" />
  </S>
);

export const PenIcon = (p: IP) => (
  <S {...p}>
    <path d="M4 20l.8-3.2L15.6 6a2 2 0 0 1 2.8 0l-.4-.4a2 2 0 0 1 0 2.8L7.2 19.2z" />
    <path d="M13.5 7.5l3 3" />
  </S>
);

export const ChartIcon = (p: IP) => (
  <S {...p}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 16v-5M12 16V8M16 16v-3" />
  </S>
);

export const PlayIcon = (p: IP) => (
  <S {...p}>
    <path d="M8 5.5v13l10-6.5z" />
  </S>
);

export const KeyIcon = (p: IP) => (
  <S {...p}>
    <circle cx="8" cy="14" r="4.5" />
    <path d="M11.5 10.5L20 2m-4 4l2.5 2.5M13.5 8.5L16 11" />
  </S>
);

export const OpenIcon = (p: IP) => (
  <S {...p}>
    <path d="M14 4h6v6M20 4l-9 9M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
  </S>
);
