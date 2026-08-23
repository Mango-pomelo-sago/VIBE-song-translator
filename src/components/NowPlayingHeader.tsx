import dynamic from "next/dynamic";
import { Star } from "lucide-react";
import type { NeteaseSong } from "@/lib/types";
import type { DifficultyScore } from "@/lib/difficulty";
import { toSavedSong } from "@/lib/playlist";
import { usePlaylist } from "./PlaylistStore";
import RoseCurve from "./RoseCurve";
import DifficultyBadge from "./DifficultyBadge";

const SdfLensBlur = dynamic(
  () => import("@/components/SdfLensBlur"),
  { ssr: false },
);

/** 当前播放歌曲头部（黑胶 + 曲名/歌手 + 难度徽章 + 收藏⭐ + SDF 镜头背景） */
export default function NowPlayingHeader({
  song,
  difficulty,
}: {
  song: NeteaseSong;
  difficulty?: DifficultyScore | null;
}) {
  const { has, toggle } = usePlaylist();
  const saved = toSavedSong(song, difficulty);
  const favorited = has(song.id);

  return (
    <div className="glass-card relative flex items-center gap-4 p-4 sm:p-5">
      {/* SDF 镜头模糊效果作为卡片背景 */}
      <SdfLensBlur />
      <div className="relative z-10">
        <RoseCurve size="lg" />
      </div>
      <div className="relative z-10 min-w-0 flex-1">
        <p className="font-display text-sm uppercase tracking-widest text-bauhaus-blue">
          Now Playing
        </p>
        <h3 className="font-sc truncate text-xl font-bold text-ink sm:text-2xl">
          {song.name}
        </h3>
        <p className="font-sc truncate text-sm text-ink/70">
          {song.artists.map((a) => a.name).join(" · ")}
        </p>
      </div>
      <button
        onClick={() => toggle(saved)}
        className="relative z-10 shrink-0 text-2xl transition-transform hover:scale-110 active:scale-95"
        title={favorited ? "取消收藏" : "收藏到歌单"}
        aria-label={favorited ? "取消收藏" : "收藏到歌单"}
      >
        <Star
          size={22}
          className={
            favorited
              ? "fill-bauhaus-blue text-bauhaus-blue"
              : "text-ink/40"
          }
        />
      </button>
      <div className="relative z-10 shrink-0">
        <DifficultyBadge difficulty={difficulty} />
      </div>
    </div>
  );
}