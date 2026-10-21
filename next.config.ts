import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // kuromoji 形态素词典（~18MB）只在服务端 /api/song 用，不进前端 bundle。
  // Vercel serverless 不会默认打包 node_modules 里的文件，必须显式 trace 进函数。
  outputFileTracingIncludes: {
    "/api/song": [
      "./node_modules/kuromoji/dict/**/*",
      // 法语离线词表（运行时 fs 读取，避免 5MB JSON 进入 TS 类型检查/客户端 bundle）
      "./src/data/fr/lexicon.json",
    ],
    "/api/dictionary": [
      // 法语词典同样运行时读取本地词表
      "./src/data/fr/lexicon.json",
    ],
  },
};

export default nextConfig;
