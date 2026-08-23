import { afterEach, describe, expect, it, vi } from "vitest";
import { lookup, lookupWithFallback } from "./dictionary";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(handler: (url: string) => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn((url: RequestInfo | URL) => handler(String(url))));
}

const OK = (data: unknown) =>
  new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

describe("lookup 缓存与限流", () => {
  it("首次请求 Jisho，重复查询走缓存（一次请求）", async () => {
    const calls: string[] = [];
    stubFetch(async (url) => {
      calls.push(url);
      return OK([
        {
          slug: "sora",
          japanese: [{ word: "空", reading: "そら" }],
          senses: [{ english_definitions: ["sky"], parts_of_speech: ["noun"] }],
        },
      ]);
    });
    const a = await lookup("空");
    const b = await lookup("空");
    expect(a?.word).toBe("空");
    expect(a?.reading).toBe("そら");
    expect(b).toBe(a);
    expect(calls.length).toBe(1);
  });

  it("查无返回 null", async () => {
    stubFetch(async () => OK([]));
    expect(await lookup("zzz")).toBeNull();
  });

  it("miss 时用基本形重查", async () => {
    const calls: string[] = [];
    stubFetch(async (url) => {
      calls.push(url);
      const kw = /keyword=(.*)$/.exec(url)?.[1];
      const decoded = kw ? decodeURIComponent(kw) : "";
      if (decoded === "分かっ") {
        return OK([]);
      }
      return OK([
        {
          slug: "wakaru",
          japanese: [{ word: "分かる", reading: "わかる" }],
          senses: [{ english_definitions: ["to understand"], parts_of_speech: ["verb"] }],
        },
      ]);
    });
    const entry = await lookupWithFallback("分かっ", "分かる");
    expect(entry?.word).toBe("分かる");
    expect(calls.length).toBe(2);
  });

  it("失败进黑名单，后续直接 null 不再请求", async () => {
    let n = 0;
    stubFetch(async () => {
      n++;
      return new Response("", { status: 500 });
    });
    expect(await lookup("爆発")).toBeNull();
    expect(await lookup("爆発")).toBeNull();
    expect(n).toBe(1);
  });

  it("429 同样进黑名单", async () => {
    let n = 0;
    stubFetch(async () => {
      n++;
      return new Response("", { status: 429 });
    });
    expect(await lookup("限界")).toBeNull();
    expect(await lookup("限界")).toBeNull();
    expect(n).toBe(1);
  });
});
