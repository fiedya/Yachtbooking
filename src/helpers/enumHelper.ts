import { UserStatus } from "@/src/entities/user";
import { YachtStatus } from "@/src/entities/yacht";

export function getUserStatusLabel(status: UserStatus): string {
  switch (status) {
    case UserStatus.ToVerify:
      return "Niezweryfikowany";
    case UserStatus.Verified:
      return "Zweryfikowany";
    case UserStatus.Rejected:
      return "Odrzucony";
    default:
      return "Nieznany";
  }
}

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
