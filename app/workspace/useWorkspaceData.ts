"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/types/chat";
import type { StoredDataset } from "@/types/datasets";
import { rehydrateDuckDB } from "@/lib/duckdb/rehydrateDuckDB";
import { fetchSessions } from "@/lib/chat/fetchSessions";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { ShowToast } from "./useToasts";

export type SchemaMap = Record<string, unknown[]>;

// Owns all workspace boot state: datasets, schemas, sessions, user, and the
// ready/error flags. Runs the rehydration sequence once on mount. Mutation
// handlers (chat, uploads, deletes) live with their callers in the page hook
// layer and receive these states as arguments.
export function useWorkspaceData(showToast: ShowToast) {
  const [datasets, setDatasets] = useState<StoredDataset[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [schemas, setSchemas] = useState<SchemaMap>({});
  const [user, setUser] = useState<import("@supabase/supabase-js").User | null>(
    null,
  );
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initWorkspace() {
      try {
        showToast("info", "Preparing your workspace...");

        const { datasets } = await rehydrateDuckDB();

        setDatasets(datasets);

        const restoredSchemas = Object.fromEntries(
          datasets.map((d) => [d.table_name, d.schema]),
        );
        setSchemas(restoredSchemas);

        const restoredSessions = await fetchSessions();

        setSessions(restoredSessions);

        if (restoredSessions.length > 0) {
          setActiveSessionId(restoredSessions[0].id);
        }

        if (!cancelled) {
          setWorkspaceError(null);
          setWorkspaceReady(true);
        }

        showToast("success", "Workspace ready");
      } catch (err) {
        console.error(err);

        showToast(
          "error",
          "Workspace failed to load. Please reload the page and try again.",
        );

        if (!cancelled) {
          // Keep the workspace not-ready so queries cannot run against an
          // uninitialized/failed DuckDB state.
          setWorkspaceError(
            "Workspace failed to load. Please reload the page and try again.",
          );
          setWorkspaceReady(false);
        }
      }
    }
    initWorkspace();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return {
    datasets,
    setDatasets,
    sessions,
    setSessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    schemas,
    setSchemas,
    user,
    workspaceReady,
    workspaceError,
  };
}
