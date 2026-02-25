import { AppColors } from "./colors";

export const createHeaderStyles = (colors: AppColors) => ({
  header: {
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  adminButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  adminButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
  },
});
