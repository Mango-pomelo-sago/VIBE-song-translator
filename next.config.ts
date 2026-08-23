import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // kuromoji 形态素词典（~18MB）只在服务端 /api/song 用，不进前端 bundle。
  // Vercel serverless 不会默认打包 node_modules 里的文件，必须显式 trace 进函数。
  outputFileTracingIncludes: {
    "/api/song": ["./node_modules/kuromoji/dict/**/*"],
  },
};

export default nextConfig;
