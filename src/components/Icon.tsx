import { Platform } from "react-native";

let ExpoIcons: any = null;
let WebIcons: any = null;

if (Platform.OS !== "web") {
  ExpoIcons = require("@expo/vector-icons");
}

if (Platform.OS === "web") {
  WebIcons = require("react-icons/io5");
  var MaterialWebIcons = require("react-icons/md");
}

export default function Icon({
  name,
  size,
  color,
  type = "ion",
}: {
  name: string;
  size: number;
  color: string;
  type?: "ion" | "material";
}) {
  if (Platform.OS === "web") {
    if (type === "material") {
      const map: any = {
        edit: MaterialWebIcons.MdEdit,
        delete: MaterialWebIcons.MdDelete,
        // add your material mappings here
      };
      const Comp = map[name];
      return Comp ? <Comp size={size} color={color} /> : null;
    }

    const map: any = {
      "calendar-outline": WebIcons.IoCalendarOutline,
      "newspaper-outline": WebIcons.IoNewspaperOutline,
      "boat-outline": WebIcons.IoBoatOutline,
      "add-circle-outline": WebIcons.IoAddCircleOutline,
      "person-outline": WebIcons.IoPersonOutline,
      "key-outline": WebIcons.IoKeyOutline,
    };

    const Comp = map[name];
    return Comp ? <Comp size={size} color={color} /> : null;
  }

  if (type === "material") {
    return (
      <ExpoIcons.MaterialIcons
        name={name as any}
        size={size}
        color={color}
      />
    );
  }

  return (
    <ExpoIcons.Ionicons
      name={name as any}
      size={size}
      color={color}
    />
  );
}
