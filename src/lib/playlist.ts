"use client";

/**
 * 我的歌单（localStorage，仅本机）。
 * 收藏歌曲（区别于生词本 vibe-vocab，这里是收藏整首歌）。
 */

const KEY = "vibe-playlist:v1";

import type {
  LangCode,
  NeteaseAlbum,
  NeteaseArtist,
  NeteaseSong,
} from "./types";
import type { DifficultyScore } from "./difficulty";

export type SavedSong = {
  id: number;
  name: string;
  artists: NeteaseArtist[];
  album: NeteaseAlbum | null;
  difficulty?: DifficultyScore | null;
  /** 学习语言；旧数据缺省为日语 */
  lang?: LangCode;
  addedAt: number;
};

/** 从 NeteaseSong 构造 SavedSong（保留可选难度） */
export function toSavedSong(
  song: NeteaseSong,
  difficulty?: DifficultyScore | null,
  lang: LangCode = "ja",
): SavedSong {
  return {
    id: song.id,
    name: song.name,
    artists: song.artists,
    album: song.album,
    difficulty,
    lang,
    addedAt: Date.now(),
  };
}

export function loadPlaylist(): SavedSong[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // 旧收藏没有 lang，一律归为日语
    return (arr as SavedSong[]).map((s) => ({ ...s, lang: s.lang ?? "ja" }));
  } catch {
    return [];
  }
}

function persist(items: SavedSong[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // 存储满/隐私模式：静默失败
  }
}

export function hasPlaylist(id: number): boolean {
  return loadPlaylist().some((i) => i.id === id);
}

/** 收藏/取消收藏，返回最新列表 */
export function togglePlaylist(song: SavedSong): SavedSong[] {
  const items = loadPlaylist();
  const idx = items.findIndex((i) => i.id === song.id);
  if (idx >= 0) items.splice(idx, 1);
  else items.unshift(song);
  persist(items);
  return items;
}

export function removePlaylist(id: number): SavedSong[] {
  const items = loadPlaylist().filter((i) => i.id !== id);
  persist(items);
  return items;
}