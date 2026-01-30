import storage from "@react-native-firebase/storage";
import { Platform } from "react-native";

export async function uploadImage(
  localUri: string,
  path: string,
): Promise<string> {
  const ref = storage().ref(path);

  const uploadUri =
    Platform.OS === "android" ? localUri.replace("file://", "") : localUri;

  await ref.putFile(uploadUri);

  return await ref.getDownloadURL();
}
