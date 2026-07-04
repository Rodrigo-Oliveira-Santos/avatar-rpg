/**
 * Tests for the Google Drive URL helpers used by the Minecraft app.
 */

import { describe, it, expect } from 'vitest';
import {
  extractDriveId,
  driveDownloadUrl,
  driveThumbnailUrl,
  driveViewUrl,
  isLikelyDriveUrl,
} from '../public/js/games/minecraft/lib/drive.js';

describe('extractDriveId', () => {
  it('extracts ID from a /file/d/<id>/view share link', () => {
    expect(extractDriveId('https://drive.google.com/file/d/1AbC_dEFGhij-KLMNopQRsTUv/view?usp=sharing'))
      .toBe('1AbC_dEFGhij-KLMNopQRsTUv');
  });

  it('extracts ID from a ?id=<id> link', () => {
    expect(extractDriveId('https://drive.google.com/open?id=abc123XYZ')).toBe('abc123XYZ');
    expect(extractDriveId('https://drive.google.com/uc?id=foo-bar_baz&export=download'))
      .toBe('foo-bar_baz');
  });

  it('accepts a raw 20+ char ID as-is', () => {
    const id = 'ABCDEFGHIJKLMNOPQRSTUVWX';
    expect(extractDriveId(id)).toBe(id);
  });

  it('returns null for empty / non-Drive input', () => {
    expect(extractDriveId('')).toBe(null);
    expect(extractDriveId(null)).toBe(null);
    expect(extractDriveId('not a url')).toBe(null);
    expect(extractDriveId('short')).toBe(null);
  });
});

describe('driveDownloadUrl', () => {
  it('builds an export=download URL with the right ID', () => {
    expect(driveDownloadUrl('https://drive.google.com/file/d/XYZ_abc-123/view'))
      .toBe('https://drive.google.com/uc?export=download&id=XYZ_abc-123');
  });

  it('returns null when ID cannot be extracted', () => {
    expect(driveDownloadUrl('nope')).toBe(null);
  });
});

describe('driveThumbnailUrl', () => {
  it('uses the thumbnail endpoint with sz param', () => {
    expect(driveThumbnailUrl('https://drive.google.com/file/d/abc/view'))
      .toBe('https://drive.google.com/thumbnail?id=abc&sz=w1000');
  });
  it('honours custom size', () => {
    expect(driveThumbnailUrl('https://drive.google.com/file/d/abc/view', 400))
      .toBe('https://drive.google.com/thumbnail?id=abc&sz=w400');
  });
});

describe('driveViewUrl & isLikelyDriveUrl', () => {
  it('view URL points to uc?export=view', () => {
    expect(driveViewUrl('https://drive.google.com/file/d/abc/view'))
      .toBe('https://drive.google.com/uc?export=view&id=abc');
  });

  it('isLikelyDriveUrl is loose but rejects garbage', () => {
    expect(isLikelyDriveUrl('https://drive.google.com/whatever')).toBe(true);
    expect(isLikelyDriveUrl('ABCDEFGHIJKLMNOPQRSTUVWX')).toBe(true);
    expect(isLikelyDriveUrl('http://example.com')).toBe(false);
    expect(isLikelyDriveUrl('')).toBe(false);
  });
});
