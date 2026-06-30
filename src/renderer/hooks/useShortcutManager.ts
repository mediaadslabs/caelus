import { useEffect, useRef } from 'react';
import type { ShortcutEntry } from '../../shared/types';

const MODIFIER_KEYS = new Set(['Ctrl', 'Shift', 'Alt', 'Meta']);

function getEventModifiers(e: KeyboardEvent): string[] {
  const modifiers: string[] = [];
  if (e.ctrlKey) modifiers.push('Ctrl');
  if (e.shiftKey) modifiers.push('Shift');
  if (e.altKey) modifiers.push('Alt');
  if (e.metaKey) modifiers.push('Meta');
  return modifiers.sort();
}

function normalizeKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key;
}

function shortcutMatches(e: KeyboardEvent, shortcutKeys: string[]): boolean {
  const eventMods = getEventModifiers(e);
  const shortcutMods = shortcutKeys.filter((k) => MODIFIER_KEYS.has(k)).sort();
  const shortcutMain = shortcutKeys.find((k) => !MODIFIER_KEYS.has(k));

  if (eventMods.length !== shortcutMods.length) return false;
  for (let i = 0; i < eventMods.length; i++) {
    if (eventMods[i] !== shortcutMods[i]) return false;
  }

  if (!shortcutMain) return false;
  return normalizeKey(e.key) === normalizeKey(shortcutMain);
}

export function useShortcutManager(
  shortcuts: ShortcutEntry[],
  actions: Record<string, () => void>,
) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      for (const shortcut of shortcuts) {
        if (!shortcut.enabled) continue;
        if (shortcutMatches(e, shortcut.keys)) {
          const action = actionsRef.current[shortcut.action];
          if (action) {
            e.preventDefault();
            e.stopPropagation();
            action();
            return;
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}

export function keysToString(keys: string[]): string {
  const mods = keys.filter((k) => MODIFIER_KEYS.has(k));
  const main = keys.find((k) => !MODIFIER_KEYS.has(k));
  return [...mods, main || ''].join('+');
}

export function eventKeysToString(e: React.KeyboardEvent | KeyboardEvent): string[] {
  const keys: string[] = [];
  if (e.ctrlKey) keys.push('Ctrl');
  if (e.shiftKey) keys.push('Shift');
  if (e.altKey) keys.push('Alt');
  if (e.metaKey) keys.push('Meta');
  const main = e.key;
  const normalized = main.length === 1 ? main.toUpperCase() : main;
  keys.push(normalized);
  return keys;
}
