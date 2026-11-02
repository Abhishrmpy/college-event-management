import type { RGB } from "./color";

export type { RGB };

export interface ParticleTheme {
  primary: RGB;
  secondary: RGB;
  accent: RGB;
  glow: RGB;
  core: RGB;
}

/**
 * Ready-to-use color palettes for the ParticleText component.
 * Pass a key via the `preset` prop, or override individual colors.
 */
export const particleThemes = {
  aurora: {
    primary: [0.4, 0.49, 0.92],
    secondary: [0.46, 0.29, 0.64],
    accent: [0.8, 0.3, 0.9],
    glow: [0.0, 0.96, 1.0],
    core: [1.0, 1.0, 1.0],
  },
  sunset: {
    primary: [0.98, 0.45, 0.29],
    secondary: [0.83, 0.18, 0.45],
    accent: [0.99, 0.74, 0.24],
    glow: [1.0, 0.63, 0.35],
    core: [1.0, 0.97, 0.9],
  },
  emerald: {
    primary: [0.13, 0.77, 0.6],
    secondary: [0.06, 0.46, 0.43],
    accent: [0.53, 0.95, 0.67],
    glow: [0.4, 1.0, 0.8],
    core: [0.93, 1.0, 0.96],
  },
  monochrome: {
    primary: [0.78, 0.82, 0.9],
    secondary: [0.5, 0.55, 0.65],
    accent: [0.95, 0.96, 1.0],
    glow: [0.9, 0.93, 1.0],
    core: [1.0, 1.0, 1.0],
  },
} satisfies Record<string, ParticleTheme>;

export type ParticleThemeName = keyof typeof particleThemes;

export const resolveParticleTheme = (
  preset: ParticleThemeName = "aurora",
): ParticleTheme => particleThemes[preset] ?? particleThemes.aurora;
