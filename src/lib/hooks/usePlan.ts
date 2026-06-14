'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PlanState {
  plan_type: 'free' | 'pro' | 'school';
  prompts_used: number;
  prompt_limit: number | null;
  is_pro: boolean;
  plan_expires_at: string | null;
  subscription_status: string;
  is_blocked: boolean;
  loading: boolean;
}

const DEFAULT: PlanState = {
  plan_type: 'free',
  prompts_used: 0,
  prompt_limit: 25,
  is_pro: false,
  plan_expires_at: null,
  subscription_status: 'active',
  is_blocked: false,
  loading: true,
};

export function usePlan() {
  const [state, setState] = useState<PlanState>(DEFAULT);

  const refetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    try {
      const res = await fetch('/api/me/plan');
      if (res.ok) {
        const data = (await res.json()) as any;
        setState({ ...data, loading: false });
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { ...state, refetch };
}
