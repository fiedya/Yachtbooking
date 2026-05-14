import React, { createContext, useContext, useEffect, useState } from "react";
import { DutyOfficer } from "../entities/duty";
import { Permission } from "../entities/permissionGroup";
import { subscribeToDutyOfficers } from "../services/dutyService";
import { useAuth } from "./AuthProvider";
import { useMode } from "./ModeProvider";
import { usePermissions } from "./PermissionsProvider";

export type CalendarMode = "yachtbooking" | "duties";

type CalendarModeContextType = {
  calendarMode: CalendarMode;
  toggleCalendarMode: () => void;
  dutyOfficers: DutyOfficer[];
};

const CalendarModeContext = createContext<CalendarModeContextType>({
  calendarMode: "yachtbooking",
  toggleCalendarMode: () => {},
  dutyOfficers: [],
});

export const useCalendarMode = () => useContext(CalendarModeContext);

export function CalendarModeProvider({ children }: { children: React.ReactNode }) {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("yachtbooking");
  const [dutyOfficers, setDutyOfficers] = useState<DutyOfficer[]>([]);
  const { user } = useAuth();
  const { mode } = useMode();
  const { can } = usePermissions();
  const canManageDuty = mode === "admin" || can(Permission.ManageDuty);

  useEffect(() => {
    if (mode !== "admin") {
      setCalendarMode("yachtbooking");
    }
  }, [mode]);

  useEffect(() => {
    if (!canManageDuty || !user) {
      setDutyOfficers([]);
      return;
    }
    return subscribeToDutyOfficers(setDutyOfficers);
  }, [canManageDuty, user?.uid]);

  const toggleCalendarMode = () => {
    setCalendarMode((prev) => (prev === "yachtbooking" ? "duties" : "yachtbooking"));
  };

  return (
    <CalendarModeContext.Provider value={{ calendarMode, toggleCalendarMode, dutyOfficers }}>
      {children}
    </CalendarModeContext.Provider>
  );
}
