export type RGB = [number, number, number];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const normalizeHex = (hex: string): string | null => {
  const value = hex.trim().replace(/^#/, "");

  if (/^[0-9a-f]{3}$/i.test(value)) {
    return value
      .split("")
      .map((char) => char + char)
      .join("");
  }

  return /^[0-9a-f]{6}$/i.test(value) ? value : null;
};

/**
 * Convert a CSS hex color (e.g. `#3b82f6` or `#38f`) to normalized RGB.
 * Invalid input falls back to white so shader uniforms never receive NaN.
 */
export const hexToRGB = (hex: string): RGB => {
  const normalized = normalizeHex(hex);
  if (!normalized) return [1, 1, 1];

  return [
    clamp01(parseInt(normalized.slice(0, 2), 16) / 255),
    clamp01(parseInt(normalized.slice(2, 4), 16) / 255),
    clamp01(parseInt(normalized.slice(4, 6), 16) / 255),
  ];
};

/** Convert a CSS `rgb()` / `rgba()` string to normalized RGB. */
export const rgbStringToRGB = (value: string): RGB => {
  const match = value.match(
    /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i,
  );

  if (!match) return [1, 1, 1];

  return [
    clamp01(Number(match[1]) / 255),
    clamp01(Number(match[2]) / 255),
    clamp01(Number(match[3]) / 255),
  ];
};
