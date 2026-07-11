import { useEffect, useRef } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  AdditiveBlending,
  Color,
  Vector2,
  MathUtils,
} from "three";

/**
 * HeroCanvas — the WebGL "data current" behind the hero.
 *
 * A GPU point-cloud (one BufferGeometry, one draw call) flowing through a
 * curl-ish simplex-noise field, additively blended into brand hues. Reads as a
 * living version of the static /media/hero-ambient.jpg light-stream — points
 * drift like a decoded data stream, parallax with the pointer, and the whole
 * field fades in over the still image on mount.
 *
 * This component is the HEAVY one: it pulls in `three`. It is only ever reached
 * through React.lazy() in HeroBackground, so `three` lands in its own async
 * chunk and never touches the entry bundle or non-hero routes. HeroBackground
 * also owns the prefers-reduced-motion / WebGL-support gate, so by the time we
 * mount we know motion is wanted and a context is (probably) obtainable.
 *
 * Everything is torn down on unmount (RAF, listeners, observer, GL context).
 */

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uTurbulence;
  uniform vec2  uParallax;

  attribute float aSeed;
  attribute float aScale;

  varying vec3  vColor;
  varying float vAlpha;

  // Decoder palette — signal cyan family (see .decoder block in index.css).
  const vec3 C_A = vec3(0.133, 0.812, 0.933); // #22cfee brand-500
  const vec3 C_B = vec3(0.263, 0.898, 1.000); // #43e5ff brand-400
  const vec3 C_C = vec3(0.494, 0.914, 0.980); // #7ee9fa brand-300

  //
  // Ashima Arts simplex noise (3D) — public domain / MIT.
  // https://github.com/ashima/webgl-noise
  //
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec3 p = position;
    float t = uTime * 0.06;

    // Curl-ish flow: three decorrelated noise samples push the point around.
    vec3 flow = vec3(
      snoise(p * 0.15 + vec3(t, 0.0, 0.0)),
      snoise(p * 0.15 + vec3(0.0, t, 10.0)),
      snoise(p * 0.15 + vec3(5.0, 0.0, t))
    );
    p += flow * uTurbulence;

    // Gentle horizontal streaming so it reads as a current, not a cloud.
    p.x += sin(uTime * 0.05 + p.y * 0.4) * 0.4;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

    // Pointer parallax — nearer points (smaller -z) shift more than far ones.
    float depth = -mvPosition.z;
    float parallaxAmt = clamp(1.0 - depth / 12.0, 0.0, 1.0);
    mvPosition.xy += uParallax * parallaxAmt;

    gl_Position = projectionMatrix * mvPosition;

    // Size attenuates with distance; aScale gives a mix of fine + bold motes.
    gl_PointSize = uSize * uPixelRatio * (1.0 / depth) * (0.55 + 0.9 * aScale);

    // Colour by a slow noise band so hues drift across the field over time.
    float c = snoise(p * 0.2 + vec3(uTime * 0.02));
    vec3 col = mix(C_A, C_B, smoothstep(-1.0, 0.35, c));
    col = mix(col, C_C, smoothstep(0.25, 1.0, c));
    vColor = col;

    // Fade far points + a subtle per-point twinkle.
    float distFade = clamp(1.0 - (depth - 3.0) / 9.0, 0.0, 1.0);
    float twinkle = 0.65 + 0.35 * sin(uTime * 0.9 + aSeed * 6.2831);
    vAlpha = distFade * twinkle;
  }
`;

const FRAG = /* glsl */ `
  uniform float uOpacity;
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    // Soft round mote: bright core, feathered halo.
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float a = pow(core, 1.6) * vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

export default function HeroCanvas({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Honour device thermals: fewer motes on phones, full field on desktop.
    const isSmall = window.matchMedia("(max-width: 768px)").matches;
    const COUNT = isSmall ? 1100 : 2400;
    const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2);

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      return; // No WebGL — the static fallback image carries the hero.
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(dpr);

    const canvas = renderer.domElement;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.opacity = "0";
    canvas.style.transition = "opacity 1.4s ease-out";
    container.appendChild(canvas);

    const scene = new Scene();
    const camera = new PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    // Build the point field: a wide, shallow slab so perspective gives depth.
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const scales = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = MathUtils.randFloatSpread(16); // x
      positions[i * 3 + 1] = MathUtils.randFloatSpread(8); // y
      positions[i * 3 + 2] = MathUtils.randFloatSpread(6); // z
      seeds[i] = Math.random();
      scales[i] = Math.random();
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    geometry.setAttribute("aScale", new BufferAttribute(scales, 1));

    const material = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: dpr },
        uSize: { value: isSmall ? 26 : 34 },
        uTurbulence: { value: 0.9 },
        uParallax: { value: new Vector2(0, 0) },
        uOpacity: { value: 0.85 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    // Touch Color so tree-shaking keeps it available for future tuning.
    void new Color();

    const points = new Points(geometry, material);
    scene.add(points);

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    // Pointer parallax — damped toward the target each frame.
    const pointer = new Vector2(0, 0);
    const target = new Vector2(0, 0);
    const onPointerMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // Run only while the hero is on-screen and the tab is visible.
    let running = false;
    let rafId = 0;
    let last = performance.now();
    let elapsed = 0;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;

      pointer.x = MathUtils.lerp(pointer.x, target.x, 0.04);
      pointer.y = MathUtils.lerp(pointer.y, target.y, 0.04);

      material.uniforms.uTime.value = elapsed;
      material.uniforms.uParallax.value.set(pointer.x * 0.6, pointer.y * 0.4);

      // Slow auto-drift + a touch of pointer-steer on the whole field.
      points.rotation.y = elapsed * 0.015 + pointer.x * 0.08;
      points.rotation.x = pointer.y * 0.05;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && document.visibilityState === "visible") start();
        else stop();
      },
      { threshold: 0.01 }
    );
    io.observe(container);

    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onResize = () => resize();
    window.addEventListener("resize", onResize, { passive: true });

    // Fade in after the first painted frame so the still image never flashes.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        canvas.style.opacity = "1";
      });
    });

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
