import { parseThemeHex } from "@/lib/validation/color";

export function readableForeground(hex: string): "#111827" | "#ffffff" {
  const value = Number.parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const unit = channel / 255;
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
  const contrast = (lighter: number, darker: number) => (lighter + 0.05) / (darker + 0.05);
  return contrast(1, luminance) >= contrast(luminance, 0) ? "#ffffff" : "#111827";
}

function mix(hex: string, target: "#ffffff" | "#111827", amount: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const other = Number.parseInt(target.slice(1), 16);
  const channel = (shift: number) => {
    const base = (value >> shift) & 255;
    const toward = (other >> shift) & 255;
    return Math.round(base + (toward - base) * amount);
  };
  return `#${[channel(16), channel(8), channel(0)].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

export function institutionThemeCss(colors: {
  primaryColor: string | null;
  secondaryColor: string | null;
  actionColor: string | null;
}): string {
  const primary = parseThemeHex(colors.primaryColor);
  const secondary = parseThemeHex(colors.secondaryColor);
  const action = parseThemeHex(colors.actionColor);
  if (!primary && !secondary && !action) return "";
  const light = themeBlock(primary, secondary, action, false);
  const dark = themeBlock(primary, secondary, action, true);
  return `:root{${light}}.dark{${dark}}`;
}

function themeBlock(primary: string | null, secondary: string | null, action: string | null, dark: boolean): string {
  const parts: string[] = [];
  const tone = (hex: string) => (dark && relativeIsDark(hex) ? mix(hex, "#ffffff", 0.35) : hex);
  if (primary) {
    const color = tone(primary);
    parts.push(`--primary:${color};--primary-foreground:${readableForeground(color)};`);
  }
  if (secondary) {
    const color = tone(secondary);
    parts.push(`--secondary:${color};--secondary-foreground:${readableForeground(color)};`);
  }
  if (action) {
    const color = tone(action);
    parts.push(`--accent:${color};--accent-foreground:${readableForeground(color)};`);
  }
  return parts.join("");
}

function relativeIsDark(hex: string): boolean {
  return readableForeground(hex) === "#ffffff";
}
