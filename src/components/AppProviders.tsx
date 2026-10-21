"use client";

import type { ReactNode } from "react";
import { DisplayPrefsProvider } from "./DisplayPrefs";
import { AiSettingsProvider } from "./AiSettings";
import { VocabProvider } from "./VocabStore";
import { PlaylistProvider } from "./PlaylistStore";
import { LangProvider } from "./LangProvider";

/** 全局客户端 Provider：语言 + 显示偏好 + AI 配置 + 生词本 + 我的歌单 */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      <DisplayPrefsProvider>
        <AiSettingsProvider>
          <VocabProvider>
            <PlaylistProvider>{children}</PlaylistProvider>
          </VocabProvider>
        </AiSettingsProvider>
      </DisplayPrefsProvider>
    </LangProvider>
  );
}