#!/usr/bin/env node
/**
 * 以「系统代理可被 Node fetch 识别」的方式启动 Next。
 *
 * 背景：Node 24 的全局 fetch 默认**不读取** HTTP_PROXY / HTTPS_PROXY，
 * 而 curl、浏览器会走系统代理。国内直连 Wiktionary 会超时，
 * 导致法语词条只剩本地结构信息（「本地词表已收录，暂无释义」）。
 * 这里在存在代理环境变量时补上 NODE_USE_ENV_PROXY=1（必须进程启动前设置）。
 *
 * 用法：node scripts/with-proxy.mjs next dev --turbopack
 */

import { spawn } from "node:child_process";

const env = { ...process.env };
if (env.HTTP_PROXY || env.HTTPS_PROXY) {
  env.NODE_USE_ENV_PROXY ??= "1";
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("usage: node scripts/with-proxy.mjs <command> [args...]");
  process.exit(1);
}

const child = spawn(command, args, {
  stdio: "inherit",
  env,
  // Windows 下 next 是 .cmd，需要 shell 才能解析
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
