import { ChatIcon, CodeIcon, BrandMark } from "./Icons";

interface Props {
  mode: "chat" | "coder";
  model: string;
  provider: string;
  status: "ready" | "local" | "nokey";
  meta: string;
}

/* IDE-style status strip: live session telemetry at a glance. */
export default function StatusBar({ mode, model, provider, status, meta }: Props) {
  const tone =
    status === "ready" ? "text-mint" : status === "local" ? "text-cyanic" : "text-gold";
  const dot =
    status === "ready" ? "pulse-live bg-mint" : status === "local" ? "bg-cyanic" : "bg-gold";
  const label = status === "ready" ? "ready · free" : status === "local" ? "local" : "needs key";

  return (
    <div className="statusbar relative z-20">
      <span className="flex items-center gap-1.5 font-semibold uppercase tracking-[0.14em] text-text">
        {mode === "chat" ? <ChatIcon className="h-3 w-3 text-brand" /> : <CodeIcon className="h-3 w-3 text-gold" />}
        {mode}
      </span>
      <span className="sep" />
      <span className="max-w-[220px] truncate">{model}</span>
      <span className="sep max-sm:hidden" />
      <span className="max-w-[160px] truncate max-sm:hidden">{provider}</span>
      <span className="flex-1" />
      <span className="max-md:hidden">{meta}</span>
      <span className="sep max-md:hidden" />
      <span className={`flex items-center gap-1.5 font-semibold uppercase tracking-[0.14em] ${tone}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </span>
      <span className="sep" />
      <span className="flex items-center gap-1.5 text-faint">
        <BrandMark className="h-3.5 w-3.5" />
        aide v1.1 · all models free
      </span>
    </div>
  );
}
