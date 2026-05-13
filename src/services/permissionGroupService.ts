import {
  addDocAuto,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "@/src/firebase/init";
import { Permission, PermissionGroup } from "@/src/entities/permissionGroup";

function snapToGroup(doc: any): PermissionGroup {
  return { id: doc.id, ...(doc.data() as Omit<PermissionGroup, "id">) };
}

export async function createPermissionGroup(
  name: string,
  permissions: Permission[],
): Promise<string> {
  const ref = await addDocAuto("permissionGroups", {
    name,
    permissions,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePermissionGroup(
  id: string,
  data: Partial<Pick<PermissionGroup, "name" | "permissions">>,
) {
  return updateDoc("permissionGroups", id, data);
}

export async function deletePermissionGroup(id: string) {
  return deleteDoc("permissionGroups", id);
}

export function subscribeToAllPermissionGroups(
  onChange: (groups: PermissionGroup[]) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    "permissionGroups",
    (snapshot: any) => {
      if (!snapshot) { onChange([]); return; }
      const docs = snapshot.docs ?? snapshot._docs ?? [];
      const groups: PermissionGroup[] = docs
        .map(snapToGroup)
        .sort((a: PermissionGroup, b: PermissionGroup) =>
          a.name.localeCompare(b.name),
        );
      onChange(groups);
    },
    onError,
  );
}
