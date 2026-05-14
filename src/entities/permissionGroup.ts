export enum Permission {
  ApproveBooking    = "approve_booking",
  VerifyUsers       = "verify_users",
  MultiYachtBooking = "multi_yacht_booking",
  ManageDuty        = "manage_duty",
  ChangeYachtStatus = "change_yacht_status",
  EditYacht         = "edit_yacht",
  PermissionsGroups = "permissions_groups",
}

export const PermissionLabels: Record<Permission, string> = {
  [Permission.ApproveBooking]:    "Akceptowanie / odrzucanie bookingów",
  [Permission.VerifyUsers]:       "Weryfikacja użytkowników",
  [Permission.MultiYachtBooking]: "Tworzenie bookingu z wieloma jachtami",
  [Permission.ManageDuty]:        "Dodawanie i edycja dyżurów",
  [Permission.ChangeYachtStatus]: "Zmiana statusów jachtu",
  [Permission.EditYacht]:         "Edycja danych jachtu",
  [Permission.PermissionsGroups]: "Zarządzanie grupami uprawnień",
};

export type PermissionGroup = {
  id: string;
  name: string;
  permissions: Permission[];
  createdAt: any;
};
