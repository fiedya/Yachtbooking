import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./webDatePicker.css";

type WebDatePickerProps = {
  value: Date;
  onChange: (date: Date) => void;
  mode: "date" | "time";
  placeholder?: string;
  minDate?: Date;
};

export default function WebDatePicker({
  value,
  onChange,
  mode,
  placeholder,
  minDate,
}: WebDatePickerProps) {
  return (
    <DatePicker
      selected={value}
      onChange={(next) => {
        if (next instanceof Date && !Number.isNaN(next.getTime())) {
          onChange(next);
        }
      }}
      dateFormat={mode === "time" ? "HH:mm" : "yyyy-MM-dd"}
      showTimeSelect={mode === "time"}
      showTimeSelectOnly={mode === "time"}
      timeIntervals={15}
      timeCaption="Godzina"
      placeholderText={placeholder}
      wrapperClassName="web-date-picker"
      minDate={minDate}
    />
  );
}
