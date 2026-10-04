import { useSyncExternalStore } from "react";
import { onlineManager } from "@tanstack/react-query";

/** Device connectivity as TanStack Query sees it (fed by NetInfo in QueryProvider). */
export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
  );
}
