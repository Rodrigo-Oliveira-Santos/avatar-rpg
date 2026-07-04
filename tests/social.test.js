/**
 * Tests for the optional social-link platform detector used by Minecraft.
 */

import { describe, it, expect } from 'vitest';
import { detectPlatform } from '../public/js/games/minecraft/lib/social.js';

describe('detectPlatform', () => {
  it('reconhece YouTube (youtube.com e youtu.be)', () => {
    const a = detectPlatform('https://www.youtube.com/watch?v=abc');
    expect(a?.platform).toBe('youtube');
    const b = detectPlatform('https://youtu.be/abc');
    expect(b?.platform).toBe('youtube');
  });

  it('reconhece Instagram', () => {
    const r = detectPlatform('https://www.instagram.com/p/Cabcdef/');
    expect(r?.platform).toBe('instagram');
  });

  it('classifica URLs https desconhecidos como "link" genérico', () => {
    const r = detectPlatform('https://example.com/build');
    expect(r?.platform).toBe('link');
  });

  it('devolve null para strings que não são URL', () => {
    expect(detectPlatform('')).toBe(null);
    expect(detectPlatform(null)).toBe(null);
    expect(detectPlatform('not a url')).toBe(null);
    expect(detectPlatform('ftp://example.com')).toBe(null);
  });
});
