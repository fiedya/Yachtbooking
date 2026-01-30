import { YachtStatus } from "@/src/entities/yacht";

export function getYachtStatusLabel(status: YachtStatus): string {
  switch (status) {
    case YachtStatus.Available:
      return "Dostępny";
    case YachtStatus.Maintenance:
      return "Serwis";
    case YachtStatus.Disabled:
      return "Wyłączony";
    default:
      return "Nieznany";
  }
}
