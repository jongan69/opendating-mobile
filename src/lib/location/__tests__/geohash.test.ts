// Privacy-critical: ensure raw GPS never leaves the geohash module
import { encode, toCoarseGeohash, hasSignificantChange } from '../geohash';

describe('geohash', () => {
  describe('encode', () => {
    it('encodes coordinates to valid geohash', () => {
      // Tampa, FL area
      const hash = encode(27.9506, -82.4572, 9);
      expect(hash).toBeDefined();
      expect(hash.length).toBe(9);
      expect(hash).toMatch(/^[0-9b-hjkm-np-z]+$/); // base32 geohash charset
    });

    it('produces consistent output for same input', () => {
      const hash1 = encode(40.7128, -74.006, 5);
      const hash2 = encode(40.7128, -74.006, 5);
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different locations', () => {
      const nyc = encode(40.7128, -74.006, 5);
      const sf = encode(37.7749, -122.4194, 5);
      expect(nyc).not.toBe(sf);
    });

    it('increasing precision gives longer hash', () => {
      const h3 = encode(27.9506, -82.4572, 3);
      const h5 = encode(27.9506, -82.4572, 5);
      expect(h3.length).toBe(3);
      expect(h5.length).toBe(5);
      expect(h5.startsWith(h3)).toBe(true);
    });

    it('handles equator coordinates', () => {
      const hash = encode(0, 0, 5);
      expect(hash).toBeDefined();
      expect(hash.length).toBe(5);
    });

    it('handles extreme coordinates', () => {
      const north = encode(89.9, 179.9, 5);
      const south = encode(-89.9, -179.9, 5);
      expect(north).toBeDefined();
      expect(south).toBeDefined();
      expect(north).not.toBe(south);
    });
  });

  describe('toCoarseGeohash', () => {
    it('returns exactly 5 characters', () => {
      const hash = toCoarseGeohash(27.9506, -82.4572);
      expect(hash.length).toBe(5);
    });

    it('NEVER returns raw coordinates', () => {
      const hash = toCoarseGeohash(27.9506, -82.4572);
      expect(hash).not.toContain('27.9506');
      expect(hash).not.toContain('-82.4572');
      expect(hash).not.toContain('lat');
      expect(hash).not.toContain('lng');
    });

    it('produces base32 hash string', () => {
      const hash = toCoarseGeohash(40.7128, -74.006);
      expect(hash).toMatch(/^[0-9b-hjkm-np-z]{5}$/);
    });

    it('NEVER exceeds 5 characters', () => {
      for (let i = 0; i < 100; i++) {
        const lat = Math.random() * 180 - 90;
        const lng = Math.random() * 360 - 180;
        const hash = toCoarseGeohash(lat, lng);
        expect(hash.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('hasSignificantChange', () => {
    it('returns true when old is empty', () => {
      expect(hasSignificantChange('', 'abcde')).toBe(true);
    });

    it('returns false for identical prefixes', () => {
      expect(hasSignificantChange('abcde', 'abcde')).toBe(false);
    });

    it('returns true for completely different prefixes', () => {
      expect(hasSignificantChange('abcde', 'fghij')).toBe(true);
    });

    it('returns false for small prefix differences', () => {
      // 'abcde' vs 'abcdf' — only last char differs
      expect(hasSignificantChange('abcde', 'abcdf', 3)).toBe(false);
    });

    it('returns true for significant prefix differences', () => {
      // 'abcde' vs 'abxyz' — 3 chars differ
      expect(hasSignificantChange('abcde', 'abxyz', 3)).toBe(true);
    });
  });
});
