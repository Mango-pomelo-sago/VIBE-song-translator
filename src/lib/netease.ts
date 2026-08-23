import type { NeteaseArtist, NeteaseSong } from "./types";

/** 网易云非官方 web 接口封装（服务端专用）。带 Referer/UA 伪装 + 超时 + 重试。 */

const BASE = "https://music.163.com/api";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

const HEADERS = {
  "User-Agent": UA,
  Referer: "https://music.163.com/",
  Accept: "application/json, text/plain, */*",
};

type NeteaseSongRaw = {
  id: number;
  name: string;
  ar?: { id: number; name: string }[];
  al?: { id: number; name: string; picUrl?: string | null };
  dt?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...HEADERS, ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`netease http ${res.status}`);
  return (await res.json()) as T;
}

async function fetchJsonWithRetry<T>(
  url: string,
  init?: RequestInit,
  retries = 2,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchJson<T>(url, init);
    } catch (e) {
      lastErr = e;
      if (i < retries) await sleep(400 * (i + 1));
    }
  }
  throw lastErr;
}

/** 网易云封面的 http → https，避免混合内容 / 403 */
function normalizeCover(picUrl?: string | null): string | null {
  if (!picUrl) return null;
  return picUrl.replace(/^http:/, "https:");
}

function mapSong(raw: NeteaseSongRaw): NeteaseSong {
  return {
    id: raw.id,
    name: raw.name,
    artists: (raw.ar ?? []).map(
      (a): NeteaseArtist => ({ id: a.id, name: a.name }),
    ),
    album: raw.al
      ? {
          id: raw.al.id,
          name: raw.al.name,
          picUrl: normalizeCover(raw.al.picUrl),
        }
      : null,
    durationMs: raw.dt ?? null,
  };
}

/** 搜索歌曲，返回候选列表 */
export async function searchSongs(query: string): Promise<NeteaseSong[]> {
  const url = `${BASE}/cloudsearch/pc?csrf_token=&s=${encodeURIComponent(query)}&type=1&offset=0&limit=10`;
  const data = await fetchJsonWithRetry<{
    code: number;
    result?: { songs?: NeteaseSongRaw[] };
  }>(url);
  if (data.code !== 200 || !Array.isArray(data.result?.songs)) return [];
  return data.result!.songs!.map(mapSong);
}

/** 抓取歌词（lrc 日文 + tlyric 中文翻译），两字段都可能缺失 */
export async function fetchLyric(
  id: number,
): Promise<{ lrc?: string; tlyric?: string }> {
  const url = `${BASE}/song/lyric?os=pc&id=${id}&lv=-1&kv=-1&tv=-1`;
  const data = await fetchJsonWithRetry<{
    code: number;
    lrc?: { lyric?: string };
    tlyric?: { lyric?: string };
  }>(url);
  if (data.code !== 200) throw new Error(`netease lyric code ${data.code}`);
  return { lrc: data.lrc?.lyric, tlyric: data.tlyric?.lyric };
}
