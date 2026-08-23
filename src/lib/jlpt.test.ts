import { describe, expect, it } from "vitest";
import { colorFor, labelFor, level, levelNumber, normalizeJishoJlpt } from "./jlpt";

describe("jlpt.level 词表查找", () => {
  it("N5 常见词", () => {
    expect(level("空")).toBe("N5");
    expect(level("夜")).toBe("N5");
    expect(level("好き")).toBe("N5");
  });
  it("N4 常见词", () => {
    expect(level("世界")).toBe("N4");
    expect(level("涙")).toBe("N4");
    expect(level("愛")).toBe("N4");
  });
  it("N2/N1 较难词", () => {
    expect(level("儚い")).toBe("N2");
    expect(level("綺麗")).toBe("N5"); // 綺麗 在 N5 表
    expect(level("憧憬")).toBe("N2");
  });
  it("词表缺失 → null（未知）", () => {
    expect(level("すごいふしぎなことば")).toBeNull();
    expect(level("ホバークラフト")).toBeNull();
  });
  it("读音覆盖后的 surface（二人）可查", () => {
    // tanos 全表收录（ふたり=N5），现在词表可查
    expect(level("二人")).toBe("N5");
  });
});

describe("jlpt 配色与文案", () => {
  it("N5 绿 → N1 红", () => {
    expect(colorFor("N5")).toBe("#6CBE6A");
    expect(colorFor("N1")).toBe("#fb7185");
    expect(colorFor(null)).toBeNull();
  });
  it("levelNumber 排序", () => {
    expect(levelNumber("N5")).toBe(1);
    expect(levelNumber("N1")).toBe(5);
    expect(levelNumber(null)).toBe(0);
  });
  it("labelFor 未知", () => {
    expect(labelFor("N3")).toBe("N3");
    expect(labelFor(null)).toBe("未知");
  });
});

describe("jlpt.normalizeJishoJlpt", () => {
  it("jlpt-n5 → N5", () => {
    expect(normalizeJishoJlpt("jlpt-n5")).toBe("N5");
    expect(normalizeJishoJlpt("jlpt-n1")).toBe("N1");
  });
  it("非法/空 → null", () => {
    expect(normalizeJishoJlpt(undefined)).toBeNull();
    expect(normalizeJishoJlpt("jlpt-n9")).toBeNull();
    expect(normalizeJishoJlpt("")).toBeNull();
  });
});
