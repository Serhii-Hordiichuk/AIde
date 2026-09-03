interface IP {
  className?: string;
}

const S = ({ className = "w-4 h-4", children }: IP & { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    {children}
  </svg>
);

/* ---------- brand ---------- */

/* token-hexagon "A" — the AiDe mark */
export const BrandMark = ({ className = "w-8 h-8" }: IP) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <defs>
      <linearGradient id="aide-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: "var(--t-violet2)" }} />
        <stop offset="1" style={{ stopColor: "var(--t-violet)" }} />
      </linearGradient>
    </defs>
    <rect x="1.5" y="1.5" width="29" height="29" rx="9.5" style={{ fill: "var(--t-panel3)" }} stroke="url(#aide-g)" strokeOpacity="0.7" strokeWidth="1.5" />
    {/* 文 — source language */}
    <g stroke="url(#aide-g)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M7.5 9.5h8M11.5 7.6v2.2M8.6 12.4c1 2.6 2.6 4.3 4.9 5.4M14.4 12.4c-.8 3-2.6 5-5.8 6.4" />
    </g>
    {/* A — target language */}
    <path d="M17.6 24.2L21.5 13.8l3.9 10.4" fill="none" style={{ stroke: "var(--t-gold)" }} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 20.6h5" style={{ stroke: "var(--t-gold)" }} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Wordmark = ({ className = "" }: IP) => (
  <span className={`font-sans font-extrabold tracking-tight text-text ${className}`}>
    Ai<span className="text-violet2">De</span>
    <span className="wm-cursor">_</span>
  </span>
);

/* AIDE token coin */
export const TokenIcon = ({ className = "w-4 h-4" }: IP) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <path d="M16 2.8l11.4 6.6v13.2L16 29.2 4.6 22.6V9.4z" fill="var(--t-gold)" fillOpacity="0.16" stroke="var(--t-gold)" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M11.5 21l4.5-10 4.5 10" fill="none" stroke="var(--t-gold)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="13.4" y="17.6" width="5.2" height="2.2" rx="1.1" fill="var(--t-gold)" />
  </svg>
);

/* 🇺🇦 stylized tryzub — uk variant */
export const Tryzub = ({ className = "h-9 w-9" }: { className?: string }) => (
  <span
    aria-hidden
    className={`inline-flex select-none items-center justify-center rounded-[6px] border-2 ${className}`}
    style={{
      borderColor: "var(--t-violet)",
      background: "color-mix(in srgb, var(--t-violet) 14%, transparent)",
      transform: "rotate(-4deg)",
      boxShadow: "0 2px 10px color-mix(in srgb, var(--t-violet) 32%, transparent)",
    }}
  >
    <svg viewBox="0 0 24 24" className="h-[64%] w-[64%]" fill="none" stroke="var(--t-gold)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4.6v6.9a7 7 0 0 0 14 0V4.6" />
      <path d="M12 2.4v12.8" />
      <path d="M12 2.4l-2.1 3 2.1 3 2.1-3z" fill="var(--t-gold)" strokeWidth="1.1" />
      <path d="M12 17.4v3.8" />
    </svg>
  </span>
);

/* 🇨🇳 中文专属印章 — zh variant */
export const Seal = ({ ch = "智", className = "h-9 w-9" }: { ch?: string; className?: string }) => (
  <span
    aria-hidden
    className={`inline-flex select-none items-center justify-center rounded-[6px] border-2 font-display font-bold leading-none ${className}`}
    style={{
      borderColor: "var(--t-violet)",
      color: "var(--t-violet)",
      background: "color-mix(in srgb, var(--t-violet) 12%, transparent)",
      transform: "rotate(-4deg)",
      boxShadow: "0 2px 10px color-mix(in srgb, var(--t-violet) 30%, transparent)",
    }}
  >
    {ch}
  </span>
);

/* ---------- ui ---------- */

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

export const CodeIcon = (p: IP) => (
  <S {...p}>
    <path d="M8 6.5L2.5 12 8 17.5M16 6.5l5.5 5.5L16 17.5" />
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

export const PanelLeftIcon = (p: IP) => (
  <S {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M9.5 4.5v15" />
  </S>
);

export const XIcon = (p: IP) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
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

export const KeyIcon = (p: IP) => (
  <S {...p}>
    <circle cx="8" cy="14" r="4.5" />
    <path d="M11.5 10.5L20 2m-4 4l2.5 2.5M13.5 8.5L16 11" />
  </S>
);

export const ChatIcon = (p: IP) => (
  <S {...p}>
    <path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12z" />
    <path d="M8.5 10.5h7M8.5 13.5h4.5" />
  </S>
);

export const DotsIcon = (p: IP) => (
  <S {...p}>
    <circle cx="5.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </S>
);

export const MicIcon = (p: IP) => (
  <S {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
  </S>
);

export const SpeakerIcon = (p: IP) => (
  <S {...p}>
    <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5z" />
    <path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
  </S>
);

export const SwapIcon = (p: IP) => (
  <S {...p}>
    <path d="M4 8h13M14 4.5L17.5 8 14 11.5M20 16H7M10 12.5L6.5 16l3.5 3.5" />
  </S>
);

export const DownloadIcon = (p: IP) => (
  <S {...p}>
    <path d="M12 4v11M7.5 11L12 15.5 16.5 11M4.5 19.5h15" />
  </S>
);

export const FileTextIcon = (p: IP) => (
  <S {...p}>
    <path d="M6 3.5h8L19 8.5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" />
    <path d="M13.5 3.5v5.5H19M8.5 12.5h7M8.5 15.5h5" />
  </S>
);

export const TranslateIcon = (p: IP) => (
  <S {...p}>
    <path d="M3.5 6h9M8 4v2M10.5 6c-1 3.2-3.4 5.7-6.5 7M5.5 8.5c1.3 2.6 3.7 4.4 6.5 5" />
    <path d="M13 20l4-9.5L21 20M14.3 17h5.4" />
  </S>
);

export const BoltIcon = (p: IP) => (
  <S {...p}>
    <path d="M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z" />
  </S>
);

export const GiftIcon = (p: IP) => (
  <S {...p}>
    <rect x="3.5" y="8" width="17" height="4" rx="1" />
    <path d="M5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7M12 8v12.5M12 8s-1.2-4.5-4-4.5A2.2 2.2 0 0 0 8 8zM12 8s1.2-4.5 4-4.5A2.2 2.2 0 0 1 16 8z" />
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

export const SunIcon = (p: IP) => (
  <S {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
  </S>
);

export const MoonIcon = (p: IP) => (
  <S {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
  </S>
);

export const MonitorIcon = (p: IP) => (
  <S {...p}>
    <rect x="3" y="4.5" width="18" height="12.5" rx="2" />
    <path d="M9 20.5h6M12 17v3.5" />
  </S>
);
