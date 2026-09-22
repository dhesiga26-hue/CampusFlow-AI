import { DEMO_MODE } from "@/lib/config";
import type { Store } from "@/lib/db/interface";
import { demoStore } from "@/lib/demo/store";
import { supabaseStore } from "@/lib/supabase/store";

export const activeStore: Store = DEMO_MODE ? demoStore : supabaseStore;

export function getStore(): Store {
  return activeStore;
}

export { demoStore, supabaseStore };
export type { EventFilters, Stats } from "@/lib/db/interface";