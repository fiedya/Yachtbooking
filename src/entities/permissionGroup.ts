export enum Permission {
  ApproveBooking    = "approve_booking",
  VerifyUsers       = "verify_users",
  MultiYachtBooking = "multi_yacht_booking",
  ManageDuty        = "manage_duty",
  ChangeYachtStatus = "change_yacht_status",
  EditYacht         = "edit_yacht",
  PermissionsGroups = "permissions_groups",
  CustomBookingName = "custom_booking_name",
}

export const PermissionLabels: Record<Permission, string> = {
  [Permission.ApproveBooking]:    "Akceptowanie / odrzucanie bookingów",
  [Permission.VerifyUsers]:       "Weryfikacja użytkowników",
  [Permission.MultiYachtBooking]: "Tworzenie bookingu z wieloma jachtami",
  [Permission.ManageDuty]:        "Dodawanie i edycja dyżurów",
  [Permission.ChangeYachtStatus]: "Zmiana statusów jachtu",
  [Permission.EditYacht]:         "Edycja danych jachtu",
  [Permission.PermissionsGroups]: "Zarządzanie grupami uprawnień",
  [Permission.CustomBookingName]: "Wpisanie dowolnej osoby rezerwującej",
};

export type PermissionGroup = {
  id: string;
  name: string;
  permissions: Permission[];
  createdAt: any;
};
