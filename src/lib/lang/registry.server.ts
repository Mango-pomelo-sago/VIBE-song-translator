/** 服务端语言注册表：会加载 kuromoji / 法语词表，禁止被客户端组件引用 */

import type { LangCode } from "@/lib/types";
import { jaProfile } from "./ja";
import { frProfile } from "./fr";
import type { LanguageProfile } from "./types";

const PROFILES: Partial<Record<LangCode, LanguageProfile>> = {
  ja: jaProfile,
  fr: frProfile,
};

export function hasProfile(lang: LangCode): boolean {
  return Boolean(PROFILES[lang]);
}

export function getProfile(lang: LangCode): LanguageProfile {
  const profile = PROFILES[lang];
  if (!profile) throw new Error(`language profile not implemented: ${lang}`);
  return profile;
}

/** 注册新语言 profile（供后续里程碑使用） */
export function registerProfile(profile: LanguageProfile): void {
  PROFILES[profile.code] = profile;
}
