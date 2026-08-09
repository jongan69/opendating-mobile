import {
  GENDER_OPTIONS,
  INTENT_OPTIONS,
  distanceLabel,
  genderLabel,
  humanize,
  intentLabel,
  labelFor,
} from '@/lib/profile-labels';

describe('intentLabel', () => {
  it('maps every known intent to prose', () => {
    expect(intentLabel('long_term')).toBe('Long-term relationship');
    expect(intentLabel('short_term')).toBe('Something casual');
    expect(intentLabel('friendship')).toBe('Friendship');
    expect(intentLabel('figuring_out')).toBe('Still figuring it out');
  });

  // The shipped candidate card rendered profile.relationship_intent directly,
  // so a card read "figuring_out" to the member.
  it('never leaks a raw wire value', () => {
    expect(intentLabel('figuring_out')).not.toContain('_');
  });

  // The protocol can carry an intent this build predates.
  it('humanizes an unrecognized intent rather than showing it raw', () => {
    expect(intentLabel('open_to_anything')).toBe('Open to anything');
  });

  it('returns empty for absent values', () => {
    expect(intentLabel(undefined)).toBe('');
    expect(intentLabel(null)).toBe('');
    expect(intentLabel('')).toBe('');
  });
});

describe('humanize', () => {
  // `'a_b_c'.replace('_', ' ')` replaces only the first separator; the old
  // detail screen used exactly that.
  it('replaces every separator, not just the first', () => {
    expect(humanize('a_b_c')).toBe('A b c');
    expect(humanize('one-two-three')).toBe('One two three');
  });
});

describe('genderLabel', () => {
  it('maps known genders', () => {
    expect(genderLabel('nonbinary')).toBe('Non-binary');
    expect(genderLabel('woman')).toBe('Woman');
  });
});

describe('distanceLabel', () => {
  it('normalizes the nearby buckets', () => {
    expect(distanceLabel('nearby')).toBe('Nearby');
    expect(distanceLabel('within 5 mi')).toBe('Nearby');
  });

  it('passes other buckets through trimmed', () => {
    expect(distanceLabel('  10 mi away ')).toBe('10 mi away');
  });

  it('renders nothing for buckets that carry no information', () => {
    expect(distanceLabel('unknown')).toBe('');
    expect(distanceLabel(undefined)).toBe('');
  });
});

describe('canonical option lists', () => {
  // These were duplicated in edit-profile with different labels, so the same
  // stored value described itself differently depending on the screen.
  it('has exactly one label per value', () => {
    for (const options of [GENDER_OPTIONS, INTENT_OPTIONS]) {
      const values = options.map((o) => o.value);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it('agrees with the label lookup', () => {
    for (const option of INTENT_OPTIONS) {
      expect(labelFor(INTENT_OPTIONS, option.value)).toBe(option.label);
    }
  });
});
