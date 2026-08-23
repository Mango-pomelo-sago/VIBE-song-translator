"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { loadPlaylist, togglePlaylist, removePlaylist } from "@/lib/playlist";
import type { SavedSong } from "@/lib/playlist";

type PlaylistCtx = {
  items: SavedSong[];
  has: (id: number) => boolean;
  /** 收藏/取消收藏，返回是否已收藏 */
  toggle: (song: SavedSong) => boolean;
  remove: (id: number) => void;
};

const Ctx = createContext<PlaylistCtx | null>(null);

/** 我的歌单 Provider：localStorage 单例，跨歌曲汇总 */
export function PlaylistProvider({ children }: { children: ReactNode }) {
  // 服务端先给空数组，避免 hydration 不匹配
  const [items, setItems] = useState<SavedSong[]>([]);

  // 客户端挂载后再从 localStorage 读取
  useEffect(() => {
    setItems(loadPlaylist());
  }, []);

  const toggle = useCallback((song: SavedSong): boolean => {
    const next = togglePlaylist(song);
    setItems(next);
    return next.some((i) => i.id === song.id);
  }, []);

  const remove = useCallback((id: number) => {
    const next = removePlaylist(id);
    setItems(next);
  }, []);

  const value = useMemo<PlaylistCtx>(
    () => ({
      items,
      has: (id) => items.some((i) => i.id === id),
      toggle,
      remove,
    }),
    [items, toggle, remove],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlaylist(): PlaylistCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlaylist 必须在 PlaylistProvider 内使用");
  return ctx;
}