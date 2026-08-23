import Link from "next/link";
import { ArrowRight } from "lucide-react";
import VinylRecord from "@/components/VinylRecord";

/** 404：这张唱片不存在 */
export default function NotFound() {
  return (
    <main className="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-5 py-20 text-center">
      <VinylRecord size="lg" />
      <h1 className="font-display text-6xl tracking-wide text-ink">404</h1>
      <p className="font-sc text-base text-ink/70">这张唱片不存在，或者已经下架了。</p>
      <Link
        href="/"
        className="bauhaus-btn bauhaus-btn-blue mt-2 inline-flex items-center gap-1 px-5 py-2 text-sm"
      >
        回唱片店首页
        <ArrowRight size={14} />
      </Link>
    </main>
  );
}