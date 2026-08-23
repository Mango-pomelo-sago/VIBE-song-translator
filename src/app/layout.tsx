import type { Metadata } from "next";
import {
  Geist_Mono,
  Noto_Sans_SC,
  Noto_Serif_JP,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const bebas = localFont({
  variable: "--font-bebas",
  src: "../fonts/Rousseau-Deco-2.ttf",
  display: "swap",
});

const notoSerifJp = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const notoSansSc = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = "VIBE RECORDS｜听日文歌学日语";
const DESCRIPTION =
  "输入日文歌名，抓取歌词，汉字上标注罗马音、文节断句、hover 查词与中文翻译对照——听着歌学日语。";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: "%s | VIBE RECORDS",
  },
  description: DESCRIPTION,
  applicationName: "VIBE RECORDS",
  robots: {
    index: false, // 歌词版权：不索引
    follow: false,
    noimageindex: true,
  },
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "zh_CN",
    siteName: "VIBE RECORDS",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${bebas.variable} ${notoSerifJp.variable} ${notoSansSc.variable} ${mono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
