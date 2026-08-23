"use client";

import type { DictEntry } from "@/lib/types";

/**
 * 客户端词典缓存：同一 surface 只请求一次。
 * 模块级 Map 保活整页会话；重复 hover 零请求。
 */

const done = new Map<string, DictEntry | null>();
const inflight = new Map<string, Promise<DictEntry | null>>();

export function fetchEntry(
  surface: string,
  basicForm?: string | null,
): Promise<DictEntry | null> {
  const key = surface;
  if (done.has(key)) return Promise.resolve(done.get(key) ?? null);
  if (inflight.has(key)) return inflight.get(key)!;

  const p = (async () => {
    try {
      const q = new URLSearchParams({ word: surface });
      if (basicForm && basicForm !== surface) q.set("fallback", basicForm);
      const res = await fetch(`/api/dictionary?${q.toString()}`);
      const json = await res.json();
      const entry: DictEntry | null =
        json.ok && json.found ? (json.entry as DictEntry) : null;
      done.set(key, entry);
      return entry;
    } catch {
      done.set(key, null);
      return null;
    }
  })();

  inflight.set(key, p);
  return p;
}
