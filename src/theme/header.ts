import { colors } from "./colors";

export const headerStyles = {
  header: {
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
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
};
