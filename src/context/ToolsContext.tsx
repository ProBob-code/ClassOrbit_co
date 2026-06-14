'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { defaultTools } from '@/data/default-tools';
import type { AITool } from '@/types';

export interface SystemTool extends AITool {
  is_new: boolean;
  new_until?: string | null;
  walkthrough_steps?: Array<{ title: string; body: string }> | null;
}

interface ToolsContextValue {
  tools: SystemTool[];
  newTools: SystemTool[];
  loading: boolean;
  refetch: () => Promise<void>;
}

const ToolsContext = createContext<ToolsContextValue>({
  tools: [],
  newTools: [],
  loading: true,
  refetch: async () => {},
});

function toSystemTool(t: any): SystemTool {
  return {
    ...t,
    supported_outputs: Array.isArray(t.supported_outputs)
      ? t.supported_outputs
      : (() => { try { return JSON.parse(t.supported_outputs); } catch { return []; } })(),
    walkthrough_steps: Array.isArray(t.walkthrough_steps)
      ? t.walkthrough_steps
      : (() => { try { return t.walkthrough_steps ? JSON.parse(t.walkthrough_steps) : null; } catch { return null; } })(),
    is_free: t.is_free === 1 || t.is_free === true,
    active: t.active === 1 || t.active === true,
    is_new: (t.is_new === 1 || t.is_new === true) && (!t.new_until || new Date(t.new_until) > new Date()),
  };
}

export function ToolsProvider({ children }: { children: React.ReactNode }) {
  const [tools, setTools] = useState<SystemTool[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTools = useCallback(async () => {
    try {
      const res = await fetch('/api/tools/system', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as any;
        if (Array.isArray(data.tools) && data.tools.length > 0) {
          setTools(data.tools.map(toSystemTool));
          return;
        }
      }
    } catch {}
    // Fallback to static data (local dev without D1)
    setTools(defaultTools.map(t => ({ ...t, is_new: false, new_until: null, walkthrough_steps: null })));
  }, []);

  useEffect(() => {
    fetchTools().finally(() => setLoading(false));
  }, [fetchTools]);

  const newTools = tools.filter(t => t.is_new);

  return (
    <ToolsContext.Provider value={{ tools, newTools, loading, refetch: fetchTools }}>
      {children}
    </ToolsContext.Provider>
  );
}

export function useTools() {
  return useContext(ToolsContext);
}
