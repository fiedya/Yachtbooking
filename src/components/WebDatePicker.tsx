import { Platform } from "react-native";
import WebDatePickerNative from "./WebDatePicker.native";
import WebDatePickerWeb from "./WebDatePicker.web";

const WebDatePicker = Platform.OS === "web" ? WebDatePickerWeb : WebDatePickerNative;

export default WebDatePicker;
