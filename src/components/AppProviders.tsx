"use client";

import type { ReactNode } from "react";
import { DisplayPrefsProvider } from "./DisplayPrefs";
import { AiSettingsProvider } from "./AiSettings";
import { VocabProvider } from "./VocabStore";
import { PlaylistProvider } from "./PlaylistStore";

/** 全局客户端 Provider：显示偏好 + AI 配置 + 生词本 + 我的歌单 */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <DisplayPrefsProvider>
      <AiSettingsProvider>
        <VocabProvider>
          <PlaylistProvider>{children}</PlaylistProvider>
        </VocabProvider>
      </AiSettingsProvider>
    </DisplayPrefsProvider>
  );
}