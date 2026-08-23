"use client";

import { useState } from "react";
import SearchFlow from "@/components/SearchFlow";
import VinylRecord from "@/components/VinylRecord";
import AppProviders from "@/components/AppProviders";
import UsageGuide from "@/components/UsageGuide";
import HomeTitle from "@/components/HomeTitle";
import GooeySearchBar from "@/components/GooeySearchBar";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AppProviders>
      <div className="relative min-h-screen">
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
          {/* Header */}
          <header className="animate-fade-up mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <VinylRecord size="md" />
              <HomeTitle />
            </div>
            <div className="flex items-center gap-3">
              <GooeySearchBar onSearch={setSearchQuery} />
              <UsageGuide />
            </div>
          </header>

          <SearchFlow searchQuery={searchQuery} />

          <footer className="mt-auto pt-8 text-center">
            <p className="font-sc text-xs leading-relaxed text-ink-lighter">
              本站歌词仅用于个人学习交流，版权归原作者及版权方所有。
              <br className="sm:hidden" />
              原曲请前往网易云音乐收听。
            </p>
          </footer>
        </div>
      </div>
    </AppProviders>
  );
}