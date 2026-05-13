import { Permission, PermissionGroup } from "@/src/entities/permissionGroup";
import { User } from "@/src/entities/user";
import { subscribeToAllPermissionGroups } from "@/src/services/permissionGroupService";
import { subscribeToUser } from "@/src/services/userService";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthProvider";

type PermissionsContextValue = {
  can: (permission: Permission) => boolean;
  resolvedPermissions: Set<Permission>;
  permissionGroups: PermissionGroup[];
  userProfile: User | null;
};

const PermissionsContext = createContext<PermissionsContextValue>({
  can: () => false,
  resolvedPermissions: new Set(),
  permissionGroups: [],
  userProfile: null,
});

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { uid } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [allGroups, setAllGroups] = useState<PermissionGroup[]>([]);

  useEffect(() => {
    if (!uid) {
      setUserProfile(null);
      return;
    }
    return subscribeToUser(uid, setUserProfile);
  }, [uid]);

  useEffect(() => {
    return subscribeToAllPermissionGroups(setAllGroups);
  }, []);

  const resolvedPermissions = useMemo<Set<Permission>>(() => {
    if (!userProfile) return new Set();
    if (userProfile.role === "admin") return new Set(Object.values(Permission));

    const groupIds = new Set(userProfile.permissionGroups ?? []);
    const perms = new Set<Permission>();
    for (const group of allGroups) {
      if (groupIds.has(group.id)) {
        group.permissions.forEach((p) => perms.add(p));
      }
    }
    return perms;
  }, [userProfile, allGroups]);

  const can = useMemo(
    () => (permission: Permission) => resolvedPermissions.has(permission),
    [resolvedPermissions],
  );

  return (
    <PermissionsContext.Provider
      value={{ can, resolvedPermissions, permissionGroups: allGroups, userProfile }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
