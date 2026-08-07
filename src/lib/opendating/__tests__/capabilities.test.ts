import { parseCapabilities, serviceLabel, KNOWN_ROLES } from '../capabilities';

const PK_A = 'a'.repeat(64);
const PK_B = 'b'.repeat(64);

describe('parseCapabilities', () => {
  it('returns null when the relay does not advertise OpenDating', () => {
    expect(parseCapabilities({ name: 'some relay' })).toBeNull();
    expect(parseCapabilities({})).toBeNull();
    expect(parseCapabilities(null)).toBeNull();
    expect(parseCapabilities('nope')).toBeNull();
    expect(parseCapabilities(undefined)).toBeNull();
  });

  // This is the shape the reference relay actually serves today. Reading only
  // the documented spelling made every launch fail as "incompatible".
  it('parses the deployed shape (versions / services)', () => {
    const caps = parseCapabilities({
      opendating: {
        versions: ['0.1'],
        services: { system: { pubkey: PK_A } },
      },
    });

    expect(caps).not.toBeNull();
    expect(caps!.protocol_versions).toEqual(['0.1']);
    expect(caps!.roles.system?.pubkey).toBe(PK_A);
  });

  it('parses the documented shape (protocol_versions / roles)', () => {
    const caps = parseCapabilities({
      opendating: {
        protocol_versions: ['0.1'],
        roles: { system: { pubkey: PK_A }, profile: { pubkey: PK_B } },
        features: { match_only_dms: true, coarse_location: true },
      },
    });

    expect(caps!.protocol_versions).toEqual(['0.1']);
    expect(caps!.roles.system?.pubkey).toBe(PK_A);
    expect(caps!.roles.profile?.pubkey).toBe(PK_B);
    expect(caps!.features.match_only_dms).toBe(true);
  });

  it('prefers the documented spelling when a relay sends both', () => {
    const caps = parseCapabilities({
      opendating: {
        protocol_versions: ['0.1'],
        versions: ['0.9'],
        roles: { system: { pubkey: PK_A } },
        services: { system: { pubkey: PK_B } },
      },
    });

    expect(caps!.protocol_versions).toEqual(['0.1']);
    expect(caps!.roles.system?.pubkey).toBe(PK_A);
  });

  it('reports a partial roster without failing', () => {
    const caps = parseCapabilities({
      opendating: { versions: ['0.1'], services: { system: { pubkey: PK_A } } },
    });

    expect(caps!.roles.system).toBeDefined();
    expect(caps!.roles.profile).toBeUndefined();
    expect(caps!.roles.discovery).toBeUndefined();
  });

  it('drops malformed pubkeys but keeps well-formed siblings', () => {
    const caps = parseCapabilities({
      opendating: {
        versions: ['0.1'],
        services: {
          system: { pubkey: PK_A },
          profile: { pubkey: 'too-short' },
          discovery: { pubkey: 42 },
          matcher: {},
          moderation: null,
        },
      },
    });

    expect(caps!.roles.system?.pubkey).toBe(PK_A);
    expect(caps!.roles.profile).toBeUndefined();
    expect(caps!.roles.discovery).toBeUndefined();
    expect(caps!.roles.matcher).toBeUndefined();
    expect(caps!.roles.moderation).toBeUndefined();
  });

  it('normalises pubkey case so comparisons are stable', () => {
    const caps = parseCapabilities({
      opendating: { versions: ['0.1'], services: { system: { pubkey: 'A'.repeat(64) } } },
    });
    expect(caps!.roles.system?.pubkey).toBe('a'.repeat(64));
  });

  it('survives a missing or malformed version list', () => {
    expect(parseCapabilities({ opendating: {} })!.protocol_versions).toEqual([]);
    expect(
      parseCapabilities({ opendating: { versions: 'nope' } })!.protocol_versions
    ).toEqual([]);
    expect(
      parseCapabilities({ opendating: { versions: [1, '0.1', null] } })!
        .protocol_versions
    ).toEqual(['0.1']);
  });

  it('ignores non-boolean feature flags', () => {
    const caps = parseCapabilities({
      opendating: { versions: ['0.1'], features: { vanish: true, bogus: 'yes' } },
    });
    expect(caps!.features.vanish).toBe(true);
    expect(Object.keys(caps!.features)).toEqual(['vanish']);
  });

  it('ignores unknown service roles', () => {
    const caps = parseCapabilities({
      opendating: {
        versions: ['0.1'],
        services: { system: { pubkey: PK_A }, teleporter: { pubkey: PK_B } },
      },
    });
    expect(Object.keys(caps!.roles)).toEqual(['system']);
  });
});

describe('serviceLabel', () => {
  it('gives every role plain-language copy with no protocol jargon', () => {
    for (const role of KNOWN_ROLES) {
      const label = serviceLabel(role);
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toMatch(/nostr|relay|nip|pubkey|npub|dm_policy/i);
    }
  });
});
