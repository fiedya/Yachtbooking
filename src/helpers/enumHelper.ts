import { BookingStatus } from "@/src/entities/booking";
import { UserStatus } from "@/src/entities/user";
import { YachtStatus } from "@/src/entities/yacht";
import { NewsCategory, NewsStatus } from "../entities/news";

export function getBookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.Pending:
      return "Oczekuje";
    case BookingStatus.Approved:
      return "Zatwierdzona";
    case BookingStatus.Rejected:
      return "Odrzucona";
    default:
      return "Nieznany";
  }
}

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
    case YachtStatus.NotOurs:
      return "Nie nasz";
    default:
      return "Nieznany";
  }
}

export function getNewsCategoryLabel(category: NewsCategory): string {
  switch (category) {
    case NewsCategory.General:
      return "Ogólne";
    case NewsCategory.Yachts:
      return "Jachty";
    case NewsCategory.Stanica:
      return "Stanica";
    case NewsCategory.Events:
      return "Wydarzenia";
    default:
      return "Nieznany";
  }
}

export function getNewsStatusLabel(status: NewsStatus): string {
  switch (status) {
    case NewsStatus.Active:
      return "Aktywny";
    case NewsStatus.Old:
      return "Stary";
    default:
      return "Nieznany";
  }
}
