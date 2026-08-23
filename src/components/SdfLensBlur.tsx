"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ── 顶点着色器 ─────────────────────────────────── */

const vertexShader = `
varying vec2 vTexcoord;
void main() {
  vTexcoord = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/* ── 片段着色器：忠实复刻 Codrops 原版 fragment.glsl ──
 * 只改两点：
 *  1) 原版输出 vec3(sdf) 灰度（白线 / 深底）→ 项目是浅色夏日渐变，
 *     改用 uColor uniform 注入墨色，sdf 值作为 alpha，浅底上清晰可见。
 *  2) 鼠标"镜头"（圆形 SDF）作为 stroke 的 edge 参数，控制描边锐度：
 *     镜头内边缘锐利，镜头外溶解成柔和渐变。 */
const fragmentShader = /* glsl */ `
varying vec2 vTexcoord;

uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uPixelRatio;
uniform vec3 uColor;

#ifndef PI
#define PI 3.1415926535897932384626433832795
#endif
#ifndef TWO_PI
#define TWO_PI 6.2831853071795864769252867665590
#endif

#ifndef VAR
#define VAR 0
#endif

vec2 coord(in vec2 p) {
    p = p / uResolution.xy;
    // correct aspect ratio
    if (uResolution.x > uResolution.y) {
        p.x *= uResolution.x / uResolution.y;
        p.x += (uResolution.y - uResolution.x) / uResolution.y / 2.0;
    } else {
        p.y *= uResolution.y / uResolution.x;
        p.y += (uResolution.x - uResolution.y) / uResolution.x / 2.0;
    }
    // centering
    p -= 0.5;
    p *= vec2(-1.0, 1.0);
    return p;
}

#define st0 coord(gl_FragCoord.xy)
#define mx coord(uMouse * uPixelRatio)

/* signed distance functions */
float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 d = abs(p - 0.5) * 4.2 - b + vec2(r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}
float sdCircle(in vec2 st, in vec2 center) {
    return length(st - center) * 2.0;
}
float sdPoly(in vec2 p, in float w, in int sides) {
    float a = atan(p.x, p.y) + PI;
    float r = TWO_PI / float(sides);
    float d = cos(floor(0.5 + a / r) * r - a) * length(max(abs(p) * 1.0, 0.0));
    return d * 2.0 - w;
}

/* antialiased step function */
float aastep(float threshold, float value) {
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
    return smoothstep(threshold - afwidth, threshold + afwidth, value);
}
/* Signed distance drawing methods */
float fill(in float x) { return 1.0 - aastep(0.0, x); }
float fill(float x, float size, float edge) {
    return 1.0 - smoothstep(size - edge, size + edge, x);
}
float stroke(in float d, in float t) { return (1.0 - aastep(t, abs(d))); }
float stroke(float x, float size, float w, float edge) {
    float d = smoothstep(size - edge, size + edge, x + w * 0.5) - smoothstep(size - edge, size + edge, x - w * 0.5);
    return clamp(d, 0.0, 1.0);
}

void main() {
    vec2 pixel = 1.0 / uResolution.xy;
    vec2 st = st0 + 0.5;
    vec2 posMouse = mx * vec2(1., -1.) + 0.5;

    /* sdf (Round Rect) params — 动态适配 aspect 铺满整卡 */
    float aspect = uResolution.x / uResolution.y;
    vec2 size = aspect >= 1.0
        ? vec2(2.1 * aspect + 0.4, 2.5)
        : vec2(2.5, 2.1 / aspect + 0.4);
    float roundness = 0.4;
    float borderSize = 0.05;

    /* sdf Circle params */
    float circleSize = 0.3;
    float circleEdge = 0.5;

    /* sdf Circle */
    float sdfCircle = fill(
        sdCircle(st, posMouse),
        circleSize,
        circleEdge
    );

    float sdf;
    if (VAR == 0) {
        /* sdf round rectangle with stroke param adjusted by sdf circle */
        sdf = sdRoundRect(st, size, roundness);
        sdf = stroke(sdf, 0.0, borderSize, sdfCircle) * 4.0;
    } else if (VAR == 1) {
        /* sdf circle with fill param adjusted by sdf circle */
        sdf = sdCircle(st, vec2(0.5));
        sdf = fill(sdf, 0.6, sdfCircle) * 1.2;
    } else if (VAR == 2) {
        /* sdf circle with stroke param adjusted by sdf circle */
        sdf = sdCircle(st, vec2(0.5));
        sdf = stroke(sdf, 0.58, 0.02, sdfCircle) * 4.0;
    } else if (VAR == 3) {
        /* sdf triangle with fill param adjusted by sdf circle */
        sdf = sdPoly(st - vec2(0.5, 0.45), 0.3, 3);
        sdf = fill(sdf, 0.05, sdfCircle) * 1.4;
    }

    /* 浅色背景适配：sdf 值（0~4）clamp 到 [0,1] 作为墨色 alpha */
    float a = clamp(sdf, 0.0, 1.0);
    gl_FragColor = vec4(uColor, a);
}
`;

/* ── 组件：卡片内嵌 SDF 镜头模糊 ───────────────────
 * 由父容器负责尺寸与定位（父容器需 relative + overflow-hidden），
 * 本组件在容器内 absolute 铺满，跟随容器内的鼠标活动。 */

export default function SdfLensBlur() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ── WebGL 检测，无则静默降级 ──
    const detect = document.createElement("canvas");
    const glCtx = detect.getContext("webgl") || detect.getContext("webgl2");
    if (!glCtx) return;

    const container = containerRef.current;
    if (!container) return;

    // ── 渲染器（铺满容器，absolute） ──
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.pointerEvents = "none";
    container.appendChild(renderer.domElement);

    // ── 场景 / 正交相机 ──
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    camera.position.z = 1;

    // ── 鼠标向量（含阻尼），初始置于容器中心 ──
    const vMouse = new THREE.Vector2();
    const vMouseDamp = new THREE.Vector2();
    const vResolution = new THREE.Vector2();

    const uniforms = {
      uMouse: { value: vMouseDamp },
      uResolution: { value: vResolution },
      uPixelRatio: { value: 2 },
      uColor: { value: new THREE.Color("#93CAEE") }, // 透镜浅蓝
    };

    const geometry = new THREE.PlaneGeometry(1, 1); // 由 resize 缩放铺满容器
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      defines: { VAR: 0 },
      transparent: true,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    // ── 指针追踪（相对容器，page 坐标） ──
    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      vMouse.set(e.clientX - rect.left, e.clientY - rect.top);
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const rect = container.getBoundingClientRect();
      vMouse.set(t.clientX - rect.left, t.clientY - rect.top);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    // ── 容器尺寸测量（复刻原版 resize 的宽高比校正） ──
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      const dpr = Math.min(window.devicePixelRatio, 2);

      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);

      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.updateProjectionMatrix();

      quad.scale.set(w, h, 1);
      vResolution.set(w, h).multiplyScalar(dpr);
      uniforms.uPixelRatio.value = dpr;

      // 容器尺寸变化后重设镜头中心，避免飞出容器
      vMouse.set(w / 2, h / 2);
      vMouseDamp.set(w / 2, h / 2);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener("resize", resize);

    // ── 动画循环：帧率无关阻尼 + 渲染 ──
    let raf = 0;
    let lastTime = performance.now() * 0.001;
    const update = () => {
      const time = performance.now() * 0.001;
      const dt = time - lastTime;
      lastTime = time;

      vMouseDamp.x = THREE.MathUtils.damp(vMouseDamp.x, vMouse.x, 8, dt);
      vMouseDamp.y = THREE.MathUtils.damp(vMouseDamp.y, vMouse.y, 8, dt);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(update);
    };
    update();

    // ── 清理 ──
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", resize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return <div ref={containerRef} className="sdf-canvas-container" />;
}