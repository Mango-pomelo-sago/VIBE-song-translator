/** 检测 Safari 及 Chrome on iOS，这些浏览器对 SVG 滤镜支持有限，需降级 */
export const isUnsupportedBrowser = (): boolean => {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent.toLowerCase();

  const isSafari =
    ua.includes("safari") &&
    !ua.includes("chrome") &&
    !ua.includes("chromium") &&
    !ua.includes("android") &&
    !ua.includes("firefox");

  const isChromeOniOS = ua.includes("crios");

  return isSafari || isChromeOniOS;
};