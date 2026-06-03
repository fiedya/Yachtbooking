import { onDocSnapshot, setDoc } from "@/src/firebase/init";

export type VersionControl = {
  forcedVersions: string[];
};

/** Returns 1 if a > b, -1 if a < b, 0 if equal (semver). */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/** Highest version in the forcedVersions list = minimum version users must have. */
export function getMinRequiredVersion(forcedVersions: string[]): string | null {
  if (!forcedVersions.length) return null;
  return [...forcedVersions].sort(compareVersions).at(-1) ?? null;
}

export function subscribeToVersionControl(
  onChange: (data: VersionControl) => void,
  onError?: (err: unknown) => void,
) {
  return onDocSnapshot(
    "appConfig",
    "versionControl",
    (snap: any) => {
      if (!snap.exists()) {
        onChange({ forcedVersions: [] });
        return;
      }
      onChange(snap.data() as VersionControl);
    },
    onError,
  );
}

export async function saveVersionControl(data: VersionControl): Promise<void> {
  await setDoc("appConfig", "versionControl", data);
}
