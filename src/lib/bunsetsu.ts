import { toRomaji } from "wanakana";
import { displayKana } from "./romaji";
import { isContentWord, PREFIX_POS } from "./parts";
import type { Bunsetsu, MorphToken } from "./types";

/**
 * 文节断句：
 * 内容词（名/动/形/形动/副/连体/感动/接续）开新文节；
 * 助词/助动词/记号/接尾 追加到当前文节；接头辞缓冲并入下一个内容词。
 */

function bunsetsuRomajiParts(tokens: MorphToken[]): { text: string; head: boolean }[] {
  // 逐 token 假名（已做助词例外/寒暄语/记号剔除）+ head 标记
  const kanaList: string[] = [];
  const headFlags: boolean[] = [];
  const headIndex = tokens.findIndex((t) => isContentWord(t.pos));
  for (let i = 0; i < tokens.length; i++) {
    const k = displayKana(tokens[i]);
    if (!k) continue;
    kanaList.push(k);
    headFlags.push(i <= headIndex);
  }
  if (kanaList.length === 0) return [];

  // 跨 token 促音合并：某 token 假名以っ结尾时，把っ并入下一 token 开头，
  // 这样 toRomaji 能正确双写（分かっ+た → wakatta），且该处不加空格。
  const parts: { text: string; head: boolean }[] = [];
  for (let i = 0; i < kanaList.length; i++) {
    let k = kanaList[i];
    if (i < kanaList.length - 1 && k.endsWith("っ")) {
      kanaList[i + 1] = "っ" + kanaList[i + 1];
      k = k.slice(0, -1);
    }
    if (i > 0 && k.startsWith("っ")) {
      // 促音并入前一个 part（连续无空格）
      parts[parts.length - 1].text += toRomaji(k);
    } else {
      parts.push({ text: toRomaji(k), head: headFlags[i] });
    }
  }
  return parts;
}

/** 把一行 token 切成文节列表 */
export function segmentBunsetsu(tokens: MorphToken[]): Bunsetsu[] {
  const bunsetsu: Bunsetsu[] = [];
  let current: MorphToken[] = [];
  let bufferedPrefixes: MorphToken[] = [];

  function pushCurrent() {
    if (current.length === 0) return;
    bunsetsu.push(makeBunsetsu(current));
    current = [];
  }

  for (const tok of tokens) {
    if (tok.pos === PREFIX_POS) {
      bufferedPrefixes.push(tok);
      continue;
    }
    if (isContentWord(tok.pos)) {
      pushCurrent();
      current.push(...bufferedPrefixes, tok);
      bufferedPrefixes = [];
      continue;
    }
    // 助词/助动词/记号/接尾等：追加到当前文节；开头即附属词则自开文节
    if (current.length === 0) {
      current.push(...bufferedPrefixes, tok);
      bufferedPrefixes = [];
    } else {
      current.push(tok);
    }
  }

  if (bufferedPrefixes.length) current.push(...bufferedPrefixes);
  pushCurrent();
  return bunsetsu;
}

function makeBunsetsu(tokens: MorphToken[]): Bunsetsu {
  const parts = bunsetsuRomajiParts(tokens);
  return {
    tokens,
    text: tokens.map((t) => t.surface).join(""),
    romaji: parts.map((p) => p.text).join(" "),
    headIndex: tokens.findIndex((t) => isContentWord(t.pos)),
    romajiParts: parts,
  };
}
