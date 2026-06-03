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
        settings: MaterialWebIcons.MdSettings,
        "photo-camera": MaterialWebIcons.MdPhotoCamera,
        "keyboard-arrow-up": MaterialWebIcons.MdKeyboardArrowUp,
        "keyboard-arrow-down": MaterialWebIcons.MdKeyboardArrowDown,
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
      "camera-outline": WebIcons.IoCameraOutline,
      "chevron-forward-outline": WebIcons.IoChevronForwardOutline,
      "people-outline": WebIcons.IoPeopleOutline,
      "person-add-outline": WebIcons.IoPersonAddOutline,
      "time-outline": WebIcons.IoTimeOutline,
      "document-text-outline": WebIcons.IoDocumentTextOutline,
      "notifications-outline": WebIcons.IoNotificationsOutline,
      "add": WebIcons.IoAdd,
      "pencil": WebIcons.IoPencil,
      "trash-outline": WebIcons.IoTrashOutline,
      "alert-circle-outline": WebIcons.IoAlertCircleOutline,
      "phone-portrait-outline": WebIcons.IoPhonePortraitOutline,
      "copy-outline": WebIcons.IoCopyOutline,
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
