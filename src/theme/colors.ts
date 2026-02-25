export const lightColors = {
  primary: "#003366",
  primaryLight: "#afb5ca",
  secondary: "#FF7A00",
  secondaryLight: "#FFBB7D",
  white: "#ffffff",
  grey: "#666666",
  lightGrey: "#e0e0e0",
  black: "#000000",

  background: "#ffffff",
  backgroundSoft: "#f7f9fc",

  border: "#eeeeee",
  textPrimary: "#111111",
  textSecondary: "#666666",
  textMuted: "#777777",

  danger: "#cc0000",
  dangerSoft: "#F1BDBD",

  transparent: "#00000000",
};

export const darkColors = {
  primary: "#003366",              // keep brand
  primaryLight: "#2E5C8A",         // lighter navy for hover/active

  secondary: "#FF7A00",            // keep orange
  secondaryLight: "#FF9D4D",

  white: "#ffffff",
  grey: "#A0A7B2",
  lightGrey: "#2A3A4D",
  black: "#000000",

  // === DARK MODE BASE ===
  background: "#0B1C2D",           // deep navy background
  backgroundSoft: "#10263A",       // slightly lighter panels

  border: "#1E3550",

  textPrimary: "#F2F6FA",          // soft white
  textSecondary: "#A0A7B2",
  textMuted: "#7F93A8",

  danger: "#FF5C5C",
  dangerSoft: "#5A1E1E",

  transparent: "#00000000",
};

export type AppColors = typeof lightColors;

export const colors = lightColors;