import React, { createContext, useContext, useEffect, useState } from "react";
import { DutyOfficer } from "../entities/duty";
import { subscribeToDutyOfficers } from "../services/dutyService";
import { useAuth } from "./AuthProvider";
import { useMode } from "./ModeProvider";

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

  useEffect(() => {
    if (mode !== "admin" || !user) {
      setDutyOfficers([]);
      return;
    }
    return subscribeToDutyOfficers(setDutyOfficers);
  }, [mode, user?.uid]);

  const toggleCalendarMode = () => {
    setCalendarMode((prev) => (prev === "yachtbooking" ? "duties" : "yachtbooking"));
  };

  return (
    <CalendarModeContext.Provider value={{ calendarMode, toggleCalendarMode, dutyOfficers }}>
      {children}
    </CalendarModeContext.Provider>
  );
}
