import SdfLensBlur from "./SdfLensBlur";

type Props = {
  message: string;
  onRetry?: () => void;
  actionLabel?: string;
};

/** 错误态（带重试） */
export default function ErrorState({
  message,
  onRetry,
  actionLabel = "重试",
}: Props) {
  return (
    <div className="glass-card relative p-6">
      <SdfLensBlur />
      <div className="relative z-10">
        <p className="font-display text-2xl tracking-wider text-ink">Oops!</p>
        <p className="font-sc mt-1 text-sm leading-relaxed text-ink/80">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="bauhaus-btn bauhaus-btn-blue mt-4 px-5 py-2 text-sm"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}