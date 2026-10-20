import { emptyData } from "@/lib/defaults";
import type { ForgeData, ForgeRepository, LoadResult } from "@/lib/types";
import { sanitizeImport } from "@/lib/validation";

export const DEMO_STORAGE_KEY = "forge.demo.v1";

interface StoredBlob {
  version: 1;
  data: ForgeData;
}

export function createDemoRepository(storage: Storage | null): ForgeRepository {
  return {
    mode: "demo",
    async load(): Promise<LoadResult> {
      if (!storage) return { ok: true, data: emptyData() };
      const raw = storage.getItem(DEMO_STORAGE_KEY);
      if (!raw) return { ok: true, data: emptyData() };
      try {
        const parsed = JSON.parse(raw) as StoredBlob | ForgeData;
        const candidate = "version" in parsed && parsed.version === 1 ? parsed.data : parsed;
        const data = sanitizeImport(candidate);
        if (!data) return { ok: true, data: emptyData() };
        return { ok: true, data };
      } catch {
        return {
          ok: false,
          reason: "error",
          message: "Saved demo data could not be read. It was left untouched.",
        };
      }
    },
    async save(data: ForgeData): Promise<void> {
      if (!storage) throw new Error("This browser cannot store demo data.");
      const blob: StoredBlob = { version: 1, data };
      try {
        storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(blob));
      } catch {
        throw new Error("Could not save on this device. Free some space and try again.");
      }
    },
  };
}
