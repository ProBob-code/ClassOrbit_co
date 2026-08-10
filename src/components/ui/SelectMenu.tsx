'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

// Styled replacement for a native <select>. A native select renders the OS
// picker, which ignores our theme entirely and, on small screens, opens a
// white system list detached from the field. This keeps the closed field
// looking exactly like the old select while rendering the open list in-app,
// anchored to the field so it can never escape the viewport.

export interface SelectMenuOption {
  value: string;
  label: string;
  group?: string;
}

interface SelectMenuProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  /** Shown when the current value matches no option (e.g. an empty value). */
  placeholder?: string;
  /** Rendered inside the field on the left; the field pads itself to fit. */
  leadingIcon?: React.ReactNode;
  /** Adds a filter box. Defaults to on once the list gets long. */
  searchable?: boolean;
  ariaLabel?: string;
  /** Extra classes for the wrapper (the field is always full width). */
  className?: string;
}

const SEARCHABLE_THRESHOLD = 12;
const SEARCH_BOX_HEIGHT = 56;
const MAX_LIST_HEIGHT = 240;
const MIN_LIST_HEIGHT = 152;
// Kept clear at the bottom of the screen: the mobile tab bar plus the floating
// support button sit there, and the list must not slide underneath them.
const BOTTOM_INSET = 96;
const TOP_INSET = 16;

export default function SelectMenu({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  leadingIcon,
  searchable,
  ariaLabel,
  className = '',
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [dropUp, setDropUp] = useState(false);
  const [listMaxHeight, setListMaxHeight] = useState(MAX_LIST_HEIGHT);
  const listboxId = useId();

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const showSearch = searchable ?? options.length > SEARCHABLE_THRESHOLD;
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Render in groups but keep one flat index space for keyboard navigation.
  const groups = useMemo(() => {
    const out: { name: string; options: SelectMenuOption[] }[] = [];
    for (const opt of filtered) {
      const name = opt.group ?? '';
      const last = out[out.length - 1];
      if (last && last.name === name) last.options.push(opt);
      else out.push({ name, options: [opt] });
    }
    return out;
  }, [filtered]);

  const indexOf = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((o, i) => map.set(o.value, i));
    return map;
  }, [filtered]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const commit = useCallback(
    (opt: SelectMenuOption) => {
      onChange(opt.value);
      close();
      triggerRef.current?.focus();
    },
    [onChange, close]
  );

  const openMenu = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const chrome = showSearch ? SEARCH_BOX_HEIGHT : 0;
      const below = window.innerHeight - rect.bottom - BOTTOM_INSET - 8 - chrome;
      const above = rect.top - TOP_INSET - 8 - chrome;
      // Flip above the field when there's meaningfully more room up there.
      const up = below < MIN_LIST_HEIGHT && above > below;
      setDropUp(up);
      setListMaxHeight(Math.max(MIN_LIST_HEIGHT, Math.min(MAX_LIST_HEIGHT, up ? above : below)));
    }
    setHighlight(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }, [options, value, showSearch]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, close]);

  useEffect(() => {
    if (open && showSearch) searchRef.current?.focus();
  }, [open, showSearch]);

  // Keep the highlighted row visible while arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${highlight}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setHighlight(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlight(filtered.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlight]) commit(filtered[highlight]);
        break;
      case 'Tab':
        close();
        break;
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openMenu())}
        className={`w-full bg-surface border rounded-xl ${
          leadingIcon ? 'pl-10' : 'pl-4'
        } pr-10 py-3.5 text-body-md text-left focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm cursor-pointer ${
          open ? 'border-primary' : 'border-border'
        }`}
      >
        {leadingIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none">
            {leadingIcon}
          </span>
        )}
        <span className={`block truncate ${selected ? 'text-text-main' : 'text-text-subtle'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={20}
          className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-subtle transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 z-[60] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden ${
            dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {showSearch && (
            <div className="relative border-b border-border p-2">
              <Search
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                placeholder="Search…"
                className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-label-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary"
              />
            </div>
          )}

          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            style={{ maxHeight: listMaxHeight }}
            className="overflow-y-auto custom-scrollbar py-1"
          >
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-label-sm text-text-subtle">No matches.</p>
            )}
            {groups.map((group) => (
              <div key={group.name || '_'}>
                {group.name && (
                  <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                    {group.name}
                  </p>
                )}
                {group.options.map((opt) => {
                  const idx = indexOf.get(opt.value) ?? -1;
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-idx={idx}
                      onClick={() => commit(opt)}
                      onPointerMove={() => setHighlight(idx)}
                      className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2.5 text-body-md transition-colors cursor-pointer ${
                        idx === highlight ? 'bg-primary/10' : ''
                      } ${isSelected ? 'text-primary font-semibold' : 'text-text-main'}`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check size={16} className="shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
