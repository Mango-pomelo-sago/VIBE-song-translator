"use client";

import { useState } from "react";
import SearchFlow from "@/components/SearchFlow";
import VinylRecord from "@/components/VinylRecord";
import AppProviders from "@/components/AppProviders";
import UsageGuide from "@/components/UsageGuide";
import HomeTitle from "@/components/HomeTitle";
import GooeySearchBar from "@/components/GooeySearchBar";
import LangSwitch from "@/components/LangSwitch";
import { useLang } from "@/components/LangProvider";
import { LANG_META } from "@/lib/lang/meta";

export default function Home() {
  return (
    <AppProviders>
      <HomeByLang />
    </AppProviders>
  );
}

/** 语言切换时整体重挂载，避免把上一语言的搜索/歌曲状态带过去 */
function HomeByLang() {
  const { lang } = useLang();
  return <HomeContent key={lang} />;
}

function HomeContent() {
  const { lang } = useLang();
  const meta = LANG_META[lang];
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="animate-fade-up mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span className="shrink-0 sm:hidden">
              <VinylRecord size="sm" />
            </span>
            <span className="hidden shrink-0 sm:block">
              <VinylRecord size="md" />
            </span>
            <HomeTitle />
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <LangSwitch />
            <GooeySearchBar
              onSearch={setSearchQuery}
              placeholder={meta.searchPlaceholder}
            />
            <UsageGuide />
          </div>
        </header>

        <SearchFlow key={lang} searchQuery={searchQuery} lang={lang} />

        <footer className="mt-auto pt-8 text-center">
          <p className="font-sc text-xs leading-relaxed text-ink-lighter">
            本站歌词仅用于个人学习交流，版权归原作者及版权方所有。
            <br className="sm:hidden" />
            原曲请前往网易云音乐收听。
          </p>
        </footer>
      </div>
    </div>
  );
}
