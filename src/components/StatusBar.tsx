import { ChatIcon, CodeIcon, BrandMark } from "./Icons";

interface Props {
  mode: "chat" | "coder";
  model: string;
  provider: string;
  live: boolean;
  meta: string;
}

/* IDE-style status strip: live session telemetry at a glance. */
export default function StatusBar({ mode, model, provider, live, meta }: Props) {
  return (
    <div className="statusbar relative z-20">
      <span className="flex items-center gap-1.5 font-semibold uppercase tracking-[0.14em] text-text">
        {mode === "chat" ? <ChatIcon className="h-3 w-3 text-brand" /> : <CodeIcon className="h-3 w-3 text-gold" />}
        {mode}
      </span>
      <span className="sep" />
      <span className="truncate max-w-[220px]">{model}</span>
      <span className="sep max-sm:hidden" />
      <span className="truncate max-w-[160px] max-sm:hidden">{provider}</span>
      <span className="flex-1" />
      <span className="max-md:hidden">{meta}</span>
      <span className="sep max-md:hidden" />
      <span className={`flex items-center gap-1.5 font-semibold uppercase tracking-[0.14em] ${live ? "text-mint" : "text-gold"}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${live ? "pulse-live bg-mint" : "bg-gold"}`} />
        {live ? "live" : "demo"}
      </span>
      <span className="sep" />
      <span className="flex items-center gap-1.5 text-faint">
        <BrandMark className="h-3.5 w-3.5" />
        aide v1.0
      </span>
    </div>
  );
}
