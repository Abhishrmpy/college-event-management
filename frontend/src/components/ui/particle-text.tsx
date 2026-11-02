import { useCallback, useEffect, useRef, useState } from "react";
import type { FC, PointerEvent as ReactPointerEvent } from "react";
import { cn } from "../../lib/utils";
import {
  resolveParticleTheme,
  type ParticleThemeName,
  type RGB,
} from "../../lib/particle-themes";

export interface ParticleTextProps {
  /** Text to turn into particles. Use `lines` for manual line breaks. */
  text?: string;
  /** Explicit lines. Each entry is wrapped independently. */
  lines?: string[];
  /** Base particle radius in CSS pixels. */
  particleSize?: number;
  /** Pixel sampling gap. Lower values create more, smaller particles. */
  density?: number;
  animationSpeed?: number;
  mouseForce?: number;
  interactionMode?: "attract" | "repel";
  /** Base font size in CSS pixels. Automatically shrinks to fit. */
  fontSize?: number;
  fontFamily?: string;
  className?: string;
  /** Color preset from `particleThemes`. */
  preset?: ParticleThemeName;
  primaryColor?: RGB;
  secondaryColor?: RGB;
  accentColor?: RGB;
  glowColor?: RGB;
  coreColor?: RGB;
  /** Safety cap for the number of rendered particles. */
  maxParticles?: number;
  /** Enable pointer interaction (repel/attract + click burst). */
  interactive?: boolean;
  /** Show a small FPS / particle counter overlay. */
  showStats?: boolean;
  /** Vertical center of the text block, from 0 (top) to 1 (bottom). */
  textVerticalPosition?: number;
  ariaLabel?: string;
  onReady?: (info: { particleCount: number }) => void;
}

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  isExplosion?: boolean;
}

interface ParticleColors {
  primary: RGB;
  secondary: RGB;
  accent: RGB;
  glow: RGB;
  core: RGB;
}

interface LiveProps {
  particleSize: number;
  animationSpeed: number;
  mouseForce: number;
  interactionMode: "attract" | "repel";
  interactive: boolean;
  showStats: boolean;
  colors: ParticleColors;
}

interface MainLocations {
  resolution: WebGLUniformLocation | null;
  mouse: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  primary: WebGLUniformLocation | null;
  secondary: WebGLUniformLocation | null;
  accent: WebGLUniformLocation | null;
  glow: WebGLUniformLocation | null;
  core: WebGLUniformLocation | null;
  position: number;
  size: number;
  opacity: number;
}

interface PostLocations {
  texture: WebGLUniformLocation | null;
  texelSize: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  resolution: WebGLUniformLocation | null;
  position: number;
}

const DEFAULT_TEXT = "INDO GLOBAL COLLEGE OF ENGINEERING";
const MAX_DEVICE_PIXEL_RATIO = 2;

const vertexShaderSource = `
  precision mediump float;

  attribute vec2 a_position;
  attribute float a_size;
  attribute float a_opacity;

  uniform vec2 u_resolution;

  varying float v_opacity;
  varying vec2 v_position;

  void main() {
    vec2 position = (a_position / u_resolution) * 2.0 - 1.0;
    position.y *= -1.0;

    gl_Position = vec4(position, 0.0, 1.0);
    gl_PointSize = a_size;

    v_opacity = a_opacity;
    v_position = a_position;
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec2 u_mouse;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform vec3 u_accentColor;
  uniform vec3 u_glowColor;
  uniform vec3 u_coreColor;

  varying float v_opacity;
  varying vec2 v_position;

  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float dist = length(coord);

    if (dist > 0.5) {
      discard;
    }

    float innerGlow = 1.0 - smoothstep(0.0, 0.2, dist);
    float outerGlow = 1.0 - smoothstep(0.2, 0.5, dist);
    float glow = pow(innerGlow, 3.0) + pow(outerGlow, 1.5) * 0.6;

    float mouseDist = distance(v_position, u_mouse);
    float mouseGlow = 1.0 / (1.0 + mouseDist * 0.008);
    float mouseIntensity = smoothstep(300.0, 0.0, mouseDist);

    float timeWave = sin(u_time * 0.0008) * 0.5 + 0.5;
    float positionGradient =
      (v_position.x / u_resolution.x + v_position.y / u_resolution.y) * 0.5;

    vec3 baseColor = mix(u_primaryColor, u_secondaryColor, timeWave);
    baseColor = mix(baseColor, u_accentColor, positionGradient * 0.3);

    vec3 color = mix(baseColor, u_coreColor, innerGlow * 0.8);
    color = mix(color, u_glowColor, mouseGlow * mouseIntensity * 0.6);

    float bloom = glow * (1.0 + mouseGlow * 0.8);
    float finalAlpha = bloom * v_opacity * (1.15 + mouseIntensity * 0.45);

    gl_FragColor = vec4(color, finalAlpha);
  }
`;

const postVertexShader = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = (a_position + 1.0) * 0.5;
  }
`;

const postFragmentShader = `
  precision mediump float;

  uniform sampler2D u_texture;
  uniform vec2 u_texelSize;
  uniform float u_time;
  uniform vec2 u_resolution;

  varying vec2 v_texCoord;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float filmGrain(vec2 uv, float time) {
    float grain = random(uv + time * 0.001);
    grain = pow(grain, 1.5);
    return grain * 0.075;
  }

  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);

    vec4 bloom = vec4(0.0);
    float totalWeight = 0.0;

    for (int i = -4; i <= 4; i++) {
      for (int j = -4; j <= 4; j++) {
        vec2 offset = vec2(float(i), float(j)) * u_texelSize * 2.5;
        vec4 texel = texture2D(u_texture, v_texCoord + offset);

        float weight = exp(-float(i * i + j * j) * 0.2);
        bloom += texel * weight;
        totalWeight += weight;
      }
    }
    bloom /= totalWeight;

    vec4 brightPass = max(color - 0.4, 0.0) * 3.0;
    bloom = bloom + brightPass * 0.9;

    float grain = filmGrain(v_texCoord * u_resolution, u_time);

    vec2 center = v_texCoord - 0.5;
    float aberration = length(center) * 0.015;

    vec4 r = texture2D(u_texture, v_texCoord + center * aberration * vec2(1.0, 0.0));
    vec4 g = texture2D(u_texture, v_texCoord);
    vec4 b = texture2D(u_texture, v_texCoord - center * aberration * vec2(0.0, 1.0));

    vec4 aberrated = vec4(r.r, g.g, b.b, g.a);

    float vignette = 1.0 - length(center) * 0.45;
    vignette = smoothstep(0.15, 1.0, vignette);

    vec4 final = aberrated + bloom * 0.6;
    final.rgb += grain;
    final.rgb *= vignette;

    final.rgb = pow(max(final.rgb, 0.0), vec3(0.9));
    final.rgb = mix(final.rgb, final.rgb * vec3(1.1, 0.95, 1.05), 0.3);
    final.a = clamp(final.a, 0.0, 1.0);

    gl_FragColor = final;
  }
`;

const createShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
};

const createProgram = (
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram | null => {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program linking error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  source: string,
  maxWidth: number,
): string[] => {
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (!current || ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
};

const ParticleText: FC<ParticleTextProps> = ({
  text = DEFAULT_TEXT,
  lines,
  particleSize = 2,
  density = 2,
  animationSpeed = 1.5,
  mouseForce = 250,
  interactionMode = "repel",
  fontSize,
  fontFamily = "Montserrat, sans-serif",
  className,
  preset = "aurora",
  primaryColor,
  secondaryColor,
  accentColor,
  glowColor,
  coreColor,
  maxParticles = 14000,
  interactive = true,
  showStats = false,
  textVerticalPosition = 0.5,
  ariaLabel,
  onReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const measureCanvasRef = useRef<HTMLCanvasElement>(null);

  const particlesRef = useRef<Particle[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const sizeRef = useRef({ width: 1, height: 1, dpr: 1 });
  const reducedMotionRef = useRef(false);

  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const postProgramRef = useRef<WebGLProgram | null>(null);
  const framebufferRef = useRef<WebGLFramebuffer | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const quadBufferRef = useRef<WebGLBuffer | null>(null);
  const buffersRef = useRef<{
    position: WebGLBuffer | null;
    size: WebGLBuffer | null;
    opacity: WebGLBuffer | null;
  }>({ position: null, size: null, opacity: null });
  const mainLocationsRef = useRef<MainLocations | null>(null);
  const postLocationsRef = useRef<PostLocations | null>(null);

  const positionsScratchRef = useRef<Float32Array>(new Float32Array(0));
  const sizesScratchRef = useRef<Float32Array>(new Float32Array(0));
  const opacitiesScratchRef = useRef<Float32Array>(new Float32Array(0));

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [stats, setStats] = useState({ fps: 60, particleCount: 0 });

  const theme = resolveParticleTheme(preset);
  const colors: ParticleColors = {
    primary: primaryColor ?? theme.primary,
    secondary: secondaryColor ?? theme.secondary,
    accent: accentColor ?? theme.accent,
    glow: glowColor ?? theme.glow,
    core: coreColor ?? theme.core,
  };

  const livePropsRef = useRef<LiveProps>({
    particleSize,
    animationSpeed,
    mouseForce,
    interactionMode,
    interactive,
    showStats,
    colors,
  });

  useEffect(() => {
    livePropsRef.current = {
      particleSize,
      animationSpeed,
      mouseForce,
      interactionMode,
      interactive,
      showStats,
      colors,
    };
  });

  const dispose = useCallback(() => {
    const gl = glRef.current;

    if (gl) {
      const buffers = buffersRef.current;
      if (buffers.position) gl.deleteBuffer(buffers.position);
      if (buffers.size) gl.deleteBuffer(buffers.size);
      if (buffers.opacity) gl.deleteBuffer(buffers.opacity);
      if (quadBufferRef.current) gl.deleteBuffer(quadBufferRef.current);
      if (framebufferRef.current) gl.deleteFramebuffer(framebufferRef.current);
      if (textureRef.current) gl.deleteTexture(textureRef.current);
      if (programRef.current) gl.deleteProgram(programRef.current);
      if (postProgramRef.current) gl.deleteProgram(postProgramRef.current);
    }

    glRef.current = null;
    programRef.current = null;
    postProgramRef.current = null;
    framebufferRef.current = null;
    textureRef.current = null;
    quadBufferRef.current = null;
    buffersRef.current = { position: null, size: null, opacity: null };
    mainLocationsRef.current = null;
    postLocationsRef.current = null;
  }, []);

  const initWebGL = useCallback((canvas: HTMLCanvasElement): boolean => {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
      preserveDrawingBuffer: false,
    });

    if (!gl) return false;

    glRef.current = gl;

    const vertexShader = createShader(
      gl,
      gl.VERTEX_SHADER,
      vertexShaderSource,
    );
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );
    if (!vertexShader || !fragmentShader) return false;

    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!program) return false;
    programRef.current = program;

    const postVertexShaderObj = createShader(
      gl,
      gl.VERTEX_SHADER,
      postVertexShader,
    );
    const postFragmentShaderObj = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      postFragmentShader,
    );
    if (!postVertexShaderObj || !postFragmentShaderObj) return false;

    const postProgram = createProgram(
      gl,
      postVertexShaderObj,
      postFragmentShaderObj,
    );
    gl.deleteShader(postVertexShaderObj);
    gl.deleteShader(postFragmentShaderObj);
    if (!postProgram) return false;
    postProgramRef.current = postProgram;

    mainLocationsRef.current = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      mouse: gl.getUniformLocation(program, "u_mouse"),
      time: gl.getUniformLocation(program, "u_time"),
      primary: gl.getUniformLocation(program, "u_primaryColor"),
      secondary: gl.getUniformLocation(program, "u_secondaryColor"),
      accent: gl.getUniformLocation(program, "u_accentColor"),
      glow: gl.getUniformLocation(program, "u_glowColor"),
      core: gl.getUniformLocation(program, "u_coreColor"),
      position: gl.getAttribLocation(program, "a_position"),
      size: gl.getAttribLocation(program, "a_size"),
      opacity: gl.getAttribLocation(program, "a_opacity"),
    };

    postLocationsRef.current = {
      texture: gl.getUniformLocation(postProgram, "u_texture"),
      texelSize: gl.getUniformLocation(postProgram, "u_texelSize"),
      time: gl.getUniformLocation(postProgram, "u_time"),
      resolution: gl.getUniformLocation(postProgram, "u_resolution"),
      position: gl.getAttribLocation(postProgram, "a_position"),
    };

    const framebuffer = gl.createFramebuffer();
    const texture = gl.createTexture();
    if (!framebuffer || !texture) return false;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      Math.max(1, canvas.width),
      Math.max(1, canvas.height),
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return false;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    framebufferRef.current = framebuffer;
    textureRef.current = texture;

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    quadBufferRef.current = quadBuffer;

    buffersRef.current = {
      position: gl.createBuffer(),
      size: gl.createBuffer(),
      opacity: gl.createBuffer(),
    };

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    return true;
  }, []);

  const buildParticleLayout = useCallback(() => {
    const textCanvas = measureCanvasRef.current;
    if (!textCanvas) return;

    const { width, height } = sizeRef.current;
    if (width < 2 || height < 2) return;

    const ctx = textCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const sourceLines = lines && lines.length > 0 ? lines : [text];
    const maxWidth = Math.max(80, width * 0.9);
    const maxHeight = Math.max(80, height * 0.6);

    let size = fontSize ?? Math.min(110, Math.max(24, width / 11));
    let font = "";
    let wrapped: string[] = [];
    let lineHeight = 0;

    for (let attempt = 0; attempt < 60; attempt += 1) {
      font = `900 ${size}px ${fontFamily}`;
      ctx.font = font;
      wrapped = sourceLines.flatMap((line) => wrapText(ctx, line, maxWidth));
      lineHeight = size * 1.12;

      const widest = wrapped.reduce(
        (max, line) => Math.max(max, ctx.measureText(line).width),
        0,
      );

      if (widest <= maxWidth && wrapped.length * lineHeight <= maxHeight) {
        break;
      }

      size *= 0.93;
      if (size < 14) break;
    }

    if (wrapped.length === 0) {
      particlesRef.current = [];
      setReady(false);
      return;
    }

    const step = Math.max(1, Math.round(density));
    const limit = Math.max(1, Math.floor(maxParticles));
    const centerX = width / 2;
    const blockTop = height * textVerticalPosition - (wrapped.length * lineHeight) / 2;
    const spread = Math.min(10, width * 0.012);
    const nextParticles: Particle[] = [];

    outer: for (let lineIndex = 0; lineIndex < wrapped.length; lineIndex += 1) {
      const line = wrapped[lineIndex];
      ctx.font = font;
      const lineWidth = ctx.measureText(line).width;
      const canvasWidth = Math.ceil(lineWidth + 12);
      const canvasHeight = Math.ceil(lineHeight + 12);

      textCanvas.width = canvasWidth;
      textCanvas.height = canvasHeight;

      ctx.font = font;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, canvasWidth / 2, canvasHeight / 2);

      const data = ctx.getImageData(
        0,
        0,
        canvasWidth,
        canvasHeight,
      ).data;
      const lineCenterY = blockTop + (lineIndex + 0.5) * lineHeight;

      for (let y = 0; y < canvasHeight; y += step) {
        for (let x = 0; x < canvasWidth; x += step) {
          const alpha = data[(y * canvasWidth + x) * 4 + 3];
          if (alpha <= 100) continue;

          const targetX = centerX + (x - canvasWidth / 2);
          const targetY = lineCenterY + (y - canvasHeight / 2);

          nextParticles.push({
            x: targetX + (Math.random() - 0.5) * spread,
            y: targetY + (Math.random() - 0.5) * spread,
            targetX,
            targetY,
            vx: 0,
            vy: 0,
            size: particleSize * (0.7 + Math.random() * 0.9),
            opacity: 0.7 + Math.random() * 0.3,
            life: 1,
          });

          if (nextParticles.length >= limit) break outer;
        }
      }
    }

    particlesRef.current = nextParticles;
    setReady(nextParticles.length > 0);
    setStats((previous) =>
      previous.particleCount === nextParticles.length
        ? previous
        : { ...previous, particleCount: nextParticles.length },
    );
    onReady?.({ particleCount: nextParticles.length });
  }, [
    density,
    fontFamily,
    fontSize,
    lines,
    maxParticles,
    onReady,
    particleSize,
    text,
    textVerticalPosition,
  ]);

  const resize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(
      MAX_DEVICE_PIXEL_RATIO,
      Math.max(1, window.devicePixelRatio || 1),
    );

    sizeRef.current = { width, height, dpr };

    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    const gl = glRef.current;
    if (gl && textureRef.current) {
      gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        pixelWidth,
        pixelHeight,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    buildParticleLayout();
  }, [buildParticleLayout]);

  const resizeRef = useRef(resize);

  useEffect(() => {
    resizeRef.current = resize;
  }, [resize]);

  const updateParticle = useCallback((particle: Particle, delta: number) => {
    const config = livePropsRef.current;

    if (particle.isExplosion) {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vx *= Math.pow(0.96, delta);
      particle.vy *= Math.pow(0.96, delta);
      particle.life -= 0.025 * delta;
      particle.opacity = Math.max(0, particle.life);
      return;
    }

    if (
      config.interactive &&
      !reducedMotionRef.current &&
      pointerRef.current.active
    ) {
      const dx = pointerRef.current.x - particle.x;
      const dy = pointerRef.current.y - particle.y;
      const distanceSquared = dx * dx + dy * dy;
      const forceSquared = config.mouseForce * config.mouseForce;

      if (distanceSquared < forceSquared) {
        const distance = Math.sqrt(distanceSquared);
        const force = (config.mouseForce - distance) / config.mouseForce;
        const angle = Math.atan2(dy, dx);
        const multiplier = config.interactionMode === "attract" ? 1 : -1;

        particle.vx += Math.cos(angle) * force * 3 * multiplier * delta;
        particle.vy += Math.sin(angle) * force * 3 * multiplier * delta;
      }
    }

    const returnForce = 0.065 * config.animationSpeed;
    particle.vx += (particle.targetX - particle.x) * returnForce * delta;
    particle.vy += (particle.targetY - particle.y) * returnForce * delta;

    const friction = Math.pow(0.92, delta);
    particle.vx *= friction;
    particle.vy *= friction;

    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
  }, []);

  const renderWebGL = useCallback((time: number) => {
    const gl = glRef.current;
    const program = programRef.current;
    const postProgram = postProgramRef.current;
    const canvas = canvasRef.current;
    const mainLocations = mainLocationsRef.current;
    const postLocations = postLocationsRef.current;
    const framebuffer = framebufferRef.current;
    const texture = textureRef.current;
    const quadBuffer = quadBufferRef.current;

    if (
      !gl ||
      !program ||
      !postProgram ||
      !canvas ||
      !mainLocations ||
      !postLocations ||
      !framebuffer ||
      !texture ||
      !quadBuffer
    ) {
      return;
    }

    const { width, height, dpr } = sizeRef.current;
    if (width < 2 || height < 2) return;

    const particles = particlesRef.current;
    const count = particles.length;

    if (positionsScratchRef.current.length < count * 2) {
      positionsScratchRef.current = new Float32Array(count * 2);
      sizesScratchRef.current = new Float32Array(count);
      opacitiesScratchRef.current = new Float32Array(count);
    }

    const positions = positionsScratchRef.current;
    const sizes = sizesScratchRef.current;
    const opacities = opacitiesScratchRef.current;

    for (let index = 0; index < count; index += 1) {
      const particle = particles[index];
      positions[index * 2] = particle.x;
      positions[index * 2 + 1] = particle.y;
      sizes[index] = particle.size * dpr;
      opacities[index] = particle.opacity;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.uniform2f(mainLocations.resolution, width, height);
    gl.uniform2f(
      mainLocations.mouse,
      pointerRef.current.x,
      pointerRef.current.y,
    );
    gl.uniform1f(mainLocations.time, time);
    gl.uniform3fv(mainLocations.primary, livePropsRef.current.colors.primary);
    gl.uniform3fv(
      mainLocations.secondary,
      livePropsRef.current.colors.secondary,
    );
    gl.uniform3fv(mainLocations.accent, livePropsRef.current.colors.accent);
    gl.uniform3fv(mainLocations.glow, livePropsRef.current.colors.glow);
    gl.uniform3fv(mainLocations.core, livePropsRef.current.colors.core);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.position);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      positions.subarray(0, count * 2),
      gl.DYNAMIC_DRAW,
    );
    gl.enableVertexAttribArray(mainLocations.position);
    gl.vertexAttribPointer(
      mainLocations.position,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.size);
    gl.bufferData(gl.ARRAY_BUFFER, sizes.subarray(0, count), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(mainLocations.size);
    gl.vertexAttribPointer(mainLocations.size, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.opacity);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      opacities.subarray(0, count),
      gl.DYNAMIC_DRAW,
    );
    gl.enableVertexAttribArray(mainLocations.opacity);
    gl.vertexAttribPointer(mainLocations.opacity, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, count);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(postProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(postLocations.position);
    gl.vertexAttribPointer(postLocations.position, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.uniform1i(postLocations.texture, 0);
    gl.uniform2f(
      postLocations.texelSize,
      1 / Math.max(1, canvas.width),
      1 / Math.max(1, canvas.height),
    );
    gl.uniform1f(postLocations.time, time);
    gl.uniform2f(postLocations.resolution, canvas.width, canvas.height);

    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.enable(gl.BLEND);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    if (!initWebGL(canvas)) {
      dispose();
      const failFrame = requestAnimationFrame(() => setFailed(true));
      return () => cancelAnimationFrame(failFrame);
    }

    resizeRef.current();

    const observer = new ResizeObserver(() => resizeRef.current());
    observer.observe(container);

    const handleWindowResize = () => resizeRef.current();
    window.addEventListener("resize", handleWindowResize);

    let cancelled = false;
    const fonts = document.fonts;
    if (fonts?.ready) {
      fonts.ready
        .then(() => {
          if (!cancelled) resizeRef.current();
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      dispose();
    };
  }, [dispose, initWebGL]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => buildParticleLayout());
    return () => cancelAnimationFrame(frame);
  }, [buildParticleLayout]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      reducedMotionRef.current = media.matches;
    };

    updatePreference();
    media.addEventListener("change", updatePreference);

    return () => {
      media.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    let frames = 0;
    let statsTime = previous;

    const loop = (now: number) => {
      const delta = Math.min(
        3,
        Math.max(0.25, (now - previous) / (1000 / 60)),
      );
      previous = now;

      const particles = particlesRef.current;
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        updateParticle(particle, delta);
        if (particle.isExplosion && particle.life <= 0) {
          particles.splice(index, 1);
        }
      }

      renderWebGL(now);

      frames += 1;
      if (livePropsRef.current.showStats && now - statsTime >= 500) {
        const fps = Math.round((frames * 1000) / (now - statsTime));
        frames = 0;
        statsTime = now;
        setStats({ fps, particleCount: particles.length });
      }

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [renderWebGL, updateParticle]);

  const updatePointer = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current.x = event.clientX - rect.left;
    pointerRef.current.y = event.clientY - rect.top;
    pointerRef.current.active = true;
  }, []);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      updatePointer(event);
    },
    [updatePointer],
  );

  const handlePointerLeave = useCallback(() => {
    pointerRef.current.active = false;
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!livePropsRef.current.interactive) return;

      updatePointer(event);

      if (reducedMotionRef.current) return;

      const { x, y } = pointerRef.current;
      const config = livePropsRef.current;
      const explosionCount = 120;

      for (let index = 0; index < explosionCount; index += 1) {
        const angle = (Math.PI * 2 * index) / explosionCount;
        const velocity = 4 + Math.random() * 60;

        particlesRef.current.push({
          x,
          y,
          targetX: x,
          targetY: y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          size: config.particleSize * 0.8,
          opacity: 1,
          life: 1,
          isExplosion: true,
        });
      }

      particlesRef.current.forEach((particle) => {
        if (particle.isExplosion) return;

        const dx = particle.x - x;
        const dy = particle.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          const force = (120 - distance) / 120;
          const angle = Math.atan2(dy, dx);
          particle.vx += Math.cos(angle) * force * 90;
          particle.vy += Math.sin(angle) * force * 90;
        }
      });
    },
    [updatePointer],
  );

  const fallbackText = lines && lines.length > 0 ? lines.join(" ") : text;

  return (
    <div
      ref={containerRef}
      className={cn("relative h-screen w-full overflow-hidden", className)}
    >
      <canvas
        ref={measureCanvasRef}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <canvas
        ref={canvasRef}
        className="particle-canvas absolute inset-0 block h-full w-full"
        role="img"
        aria-label={ariaLabel ?? fallbackText}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerLeave}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
      />

      {(!ready || failed) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
          <span
            className="text-balance bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300 bg-clip-text font-black leading-tight tracking-tight text-transparent"
            style={{
              fontFamily,
              fontSize: "clamp(1.5rem, 6vw, 4.5rem)",
            }}
          >
            {fallbackText}
          </span>
        </div>
      )}

      {showStats && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-[10px] leading-relaxed text-white/70 backdrop-blur">
          <div>FPS {stats.fps}</div>
          <div>Particles {stats.particleCount.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
};

export { ParticleText };
export default ParticleText;
