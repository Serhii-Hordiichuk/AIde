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

export const Logo = ({ className = "w-7 h-7" }: IP) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <rect width="32" height="32" rx="8" fill="#0d121c" stroke="#243350" />
    <path d="M16 6l2.4 7.1L25.5 15.5l-7.1 2.4L16 25l-2.4-7.1L6.5 15.5l7.1-2.4z" fill="#ffb454" />
    <circle cx="23.5" cy="23.5" r="3.4" fill="#2dd4bf" />
  </svg>
);

export const ChatIcon = (p: IP) => (
  <S {...p}>
    <path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12z" />
    <path d="M8.5 10.5h7M8.5 13.5h4.5" />
  </S>
);

export const GridIcon = (p: IP) => (
  <S {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <path d="M16.5 13v7M13 16.5h7" />
  </S>
);

export const BotIcon = (p: IP) => (
  <S {...p}>
    <path d="M5 11a7 7 0 0 1 14 0v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
    <path d="M9 21h6M12 4v-1.5" />
    <circle cx="9.5" cy="12.5" r="0.6" fill="currentColor" />
    <circle cx="14.5" cy="12.5" r="0.6" fill="currentColor" />
    <path d="M9.8 15.5c.7.6 1.4.9 2.2.9s1.5-.3 2.2-.9" />
  </S>
);

export const KeyIcon = (p: IP) => (
  <S {...p}>
    <circle cx="8" cy="14" r="4.5" />
    <path d="M11.5 10.5L20 2m-4 4l2.5 2.5M13.5 8.5L16 11" />
  </S>
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
    <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
  </S>
);

export const SearchIcon = (p: IP) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-3.8-3.8" />
  </S>
);

export const XIcon = (p: IP) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </S>
);

export const ChevronDown = (p: IP) => (
  <S {...p}>
    <path d="M6 9.5l6 6 6-6" />
  </S>
);

export const RefreshIcon = (p: IP) => (
  <S {...p}>
    <path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3" />
    <path d="M4.5 4v4h4M19.5 20v-4h-4" />
  </S>
);

export const BoltIcon = (p: IP) => (
  <S {...p}>
    <path d="M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z" />
  </S>
);

export const GlobeIcon = (p: IP) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5S14.5 18.2 12 20.5c-2.5-2.3-3.8-5.2-3.8-8.5S9.5 5.8 12 3.5z" />
  </S>
);

export const ServerIcon = (p: IP) => (
  <S {...p}>
    <rect x="4" y="4" width="16" height="7" rx="1.5" />
    <rect x="4" y="13" width="16" height="7" rx="1.5" />
    <path d="M7.5 7.5h.01M7.5 16.5h.01" strokeWidth={2.4} />
    <path d="M13 7.5h3.5M13 16.5h3.5" />
  </S>
);

export const BookIcon = (p: IP) => (
  <S {...p}>
    <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17.5H7.5A2.5 2.5 0 0 0 5 22z" />
    <path d="M5 19.5A2.5 2.5 0 0 1 7.5 17H19" />
  </S>
);

export const ExtIcon = (p: IP) => (
  <S {...p}>
    <path d="M14 4h6v6M20 4l-9 9M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
  </S>
);

export const SparkIcon = (p: IP) => (
  <S {...p}>
    <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
    <path d="M18.5 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" />
  </S>
);

export const ChipIcon = (p: IP) => (
  <S {...p}>
    <rect x="7" y="7" width="10" height="10" rx="2" />
    <path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3" />
  </S>
);

export const PlayIcon = (p: IP) => (
  <S {...p}>
    <path d="M8 5.5v13l10-6.5z" />
  </S>
);

export const GearIcon = (p: IP) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19 12a7 7 0 0 0-.15-1.4l2-1.55-2-3.46-2.35.95a7 7 0 0 0-2.42-1.4L13.7 2.6h-3.4l-.38 2.54a7 7 0 0 0-2.42 1.4l-2.35-.95-2 3.46 2 1.55a7 7 0 0 1 0 2.8l-2 1.55 2 3.46 2.35-.95a7 7 0 0 0 2.42 1.4l.38 2.54h3.4l.38-2.54a7 7 0 0 0 2.42-1.4l2.35.95 2-3.46-2-1.55c.1-.45.15-.92.15-1.4z" />
  </S>
);

export const UserIcon = (p: IP) => (
  <S {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5" />
  </S>
);

export const TerminalIcon = (p: IP) => (
  <S {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 9l3.5 3L7 15M12.5 15.5H17" />
  </S>
);
