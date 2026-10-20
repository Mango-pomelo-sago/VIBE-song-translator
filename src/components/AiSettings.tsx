"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Settings2, X } from "lucide-react";
import {
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_MODEL,
  aiConfigHeaders,
  clearAiConfig,
  isAiConfigComplete,
  isValidBaseUrl,
  loadAiConfig,
  normalizeBaseUrl,
  saveAiConfig,
  type AiConfig,
} from "@/lib/ai-config";

type AiSettingsCtx = {
  config: AiConfig | null;
  /** localStorage 是否已读取完毕（避免 SSR/水合文字闪烁） */
  ready: boolean;
  isConfigured: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  save: (config: AiConfig) => void;
  clear: () => void;
};

const Ctx = createContext<AiSettingsCtx | null>(null);

/** AI 配置 Provider：BYOK 配置只存本机浏览器，保存/清除均为显式操作。 */
export function AiSettingsProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setConfig(loadAiConfig());
    setReady(true);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const save = useCallback((next: AiConfig) => {
    setConfig(saveAiConfig(next));
    setIsOpen(false);
  }, []);

  const clear = useCallback(() => {
    clearAiConfig();
    setConfig(null);
  }, []);

  const value = useMemo(
    () => ({
      config,
      ready,
      isConfigured: isAiConfigComplete(config),
      isOpen,
      open,
      close,
      save,
      clear,
    }),
    [config, ready, isOpen, open, close, save, clear],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <AiSettingsModal />
    </Ctx.Provider>
  );
}

export function useAiSettings(): AiSettingsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAiSettings 必须在 AiSettingsProvider 内使用");
  return ctx;
}

type Message = { kind: "ok" | "error"; text: string } | null;

/** AI 设置弹窗：API Key / Base URL / 模型。 */
export function AiSettingsModal() {
  const { config, isOpen, close, save, clear, isConfigured } = useAiSettings();

  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(DEFAULT_AI_BASE_URL);
  const [model, setModel] = useState(DEFAULT_AI_MODEL);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  // 每次打开时用已保存配置初始化表单（不随 config 变化自动覆盖，避免清除后提示被重置）
  useEffect(() => {
    if (!isOpen) return;
    setApiKey(config?.apiKey ?? "");
    setBaseUrl(config?.baseUrl ?? DEFAULT_AI_BASE_URL);
    setModel(config?.model ?? DEFAULT_AI_MODEL);
    setShowKey(false);
    setMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const key = apiKey.trim();
  const base = normalizeBaseUrl(baseUrl);
  const mdl = model.trim() || DEFAULT_AI_MODEL;
  const keyOk = !!key;
  const baseOk = isValidBaseUrl(base);

  function validate(): boolean {
    if (!keyOk) {
      setMessage({ kind: "error", text: "请填写 API Key" });
      return false;
    }
    if (!baseOk) {
      setMessage({
        kind: "error",
        text: "Base URL 需要以 http:// 或 https:// 开头",
      });
      return false;
    }
    return true;
  }

  async function testConnection() {
    if (!validate()) return;
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...aiConfigHeaders({ apiKey: key, baseUrl: base, model: mdl }),
        },
        body: "{}",
      });
      const data = (await res.json()) as {
        ok: boolean;
        model?: string;
        error?: string;
      };
      if (!data.ok) throw new Error(data.error ?? "连接失败");
      setMessage({ kind: "ok", text: `连接成功：${data.model ?? mdl}` });
    } catch (e) {
      setMessage({
        kind: "error",
        text: e instanceof Error ? e.message : "连接失败，请稍后重试",
      });
    } finally {
      setTesting(false);
    }
  }

  function onSave() {
    if (!validate()) return;
    save({ apiKey: key, baseUrl: base, model: mdl });
  }

  function onClear() {
    clear();
    setApiKey("");
    setBaseUrl(DEFAULT_AI_BASE_URL);
    setModel(DEFAULT_AI_MODEL);
    setMessage({ kind: "ok", text: "已清除本机保存的配置" });
  }

  return createPortal(
    <div className="glass-modal-overlay z-[9999]" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-settings-title"
        className="glass-modal relative w-[30rem] max-w-[90vw] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-glass-hover hover:text-ink"
          aria-label="关闭"
        >
          <X size={14} />
        </button>

        <h2
          id="ai-settings-title"
          className="font-display mb-1 text-center text-xl tracking-wide text-ink"
        >
          AI 设置
        </h2>
        <p className="font-sc mb-5 text-center text-xs text-ink/55">
          使用你自己的 OpenAI 兼容 API；Key 仅保存在本机浏览器
        </p>

        <div className="space-y-4">
          <label className="block">
            <span className="font-sc mb-1.5 block text-xs font-bold text-ink/70">
              API Key
            </span>
            <div className="relative">
              <input
                className="glass-input w-full pr-10 text-sm"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-ink/45 transition-colors hover:bg-glass-hover hover:text-ink"
                aria-label={showKey ? "隐藏 Key" : "显示 Key"}
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="font-sc mb-1.5 block text-xs font-bold text-ink/70">
              Base URL
            </span>
            <input
              className="glass-input w-full text-sm"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={DEFAULT_AI_BASE_URL}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="font-sc mt-1 block text-[10px] text-ink/45">
              默认 {DEFAULT_AI_BASE_URL}
            </span>
          </label>

          <label className="block">
            <span className="font-sc mb-1.5 block text-xs font-bold text-ink/70">
              模型
            </span>
            <input
              className="glass-input w-full text-sm"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={DEFAULT_AI_MODEL}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="font-sc mt-1 block text-[10px] text-ink/45">
              默认 {DEFAULT_AI_MODEL}
            </span>
          </label>
        </div>

        {message ? (
          <p
            className={`font-sc mt-3 text-xs leading-relaxed ${
              message.kind === "ok" ? "text-jlpt-n4" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="bauhaus-btn bauhaus-btn-blue text-xs"
            disabled={testing}
            onClick={() => void testConnection()}
          >
            {testing ? "测试中…" : "测试连接"}
          </button>
          <button
            type="button"
            className="bauhaus-btn bauhaus-btn-yellow text-xs"
            disabled={testing}
            onClick={onSave}
          >
            保存
          </button>
          <button
            type="button"
            className="bauhaus-btn bauhaus-btn-red text-xs"
            disabled={testing}
            onClick={onClear}
          >
            清除
          </button>
          <span className="ml-auto flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isConfigured ? "bg-jlpt-n5" : "bg-bauhaus-yellow"
              }`}
              aria-hidden
            />
            <span className="font-sc text-[11px] text-ink/60">
              {isConfigured ? "本机已配置" : "本机未配置"}
            </span>
          </span>
        </div>

        <p className="font-sc mt-4 border-t border-glass-border pt-3 text-[10px] leading-relaxed text-ink/45">
          Key 随请求发送到本站 API 路由，服务端不保存；服务端若配置了环境变量，未配置时仍可直接使用。
          公共设备请谨慎填写。
        </p>
      </div>
    </div>,
    document.body,
  );
}

/** 工具栏入口按钮：显示是否已配置。 */
export function AiSettingsButton() {
  const { ready, isConfigured, open } = useAiSettings();

  return (
    <button
      type="button"
      onClick={open}
      className="flex items-center gap-1.5 rounded-lg border border-glass-border bg-glass-bg px-2.5 py-1 font-sc text-xs font-semibold text-ink/70 transition-colors hover:bg-glass-hover"
    >
      <Settings2 size={13} />
      AI 设置
      {ready ? (
        <span className="flex items-center gap-1 text-[10px] font-normal text-ink/50">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isConfigured ? "bg-bauhaus-blue" : "bg-bauhaus-yellow"
            }`}
            aria-hidden
          />
          {isConfigured ? "已配置" : "未配置"}
        </span>
      ) : null}
    </button>
  );
}
