'use client';

import { useEffect, useState, useCallback } from 'react';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export function useUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A failed network call (offline, API unreachable) must degrade to
    // "signed out", not surface as an unhandled rejection
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then(({ user }: { user: AuthUser | null }) => {
        setUser(user);
        setProfile(user ? { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url } : null);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setProfile(null);
        setLoading(false);
      });
  }, []);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setProfile(null);
    // Redirect to home after sign out
    window.location.href = '/';
  }, []);

  return { user, profile, loading, signOut };
}
