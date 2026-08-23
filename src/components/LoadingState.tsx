import RoseCurve from "./RoseCurve";
import SdfLensBlur from "./SdfLensBlur";

type Props = { label?: string };

/** 黑胶旋转加载态 */
export default function LoadingState({ label = "正在抓取歌词…" }: Props) {
  return (
    <div className="glass-card relative p-6">
      <SdfLensBlur />
      <div className="relative z-10 flex items-center gap-4">
        <RoseCurve size="lg" />
        <div>
          <p className="font-display text-2xl tracking-wider text-ink">Loading</p>
          <p className="font-sc text-sm text-ink/70">{label}</p>
        </div>
      </div>
    </div>
  );
}