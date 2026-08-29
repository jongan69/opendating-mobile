import {
  applyDiscoveryPreferences,
  getDiscoveryPreferences,
} from '@/features/discovery/discovery-preferences';
import { storage } from '@/lib/storage';

const mockUpdateDiscoveryPreferences = jest.fn();

jest.mock('@/lib/storage', () => ({
  storage: {
    getDiscoveryPreferences: jest.fn(),
    saveDiscoveryPreferences: jest.fn(),
  },
}));
jest.mock('@/lib/opendating/open-dating-client', () => ({
  getOpenDatingClient: () => ({
    updateDiscoveryPreferences: mockUpdateDiscoveryPreferences,
  }),
}));

it('keeps one relationship intent and persists the applied filters', async () => {
  mockUpdateDiscoveryPreferences.mockResolvedValue(undefined);

  const preferences = {
    min_age: 25,
    max_age: 45,
    max_distance_km: 40,
    genders: ['woman'],
    intent: 'long_term',
  };
  await applyDiscoveryPreferences(preferences);

  expect(getDiscoveryPreferences()).toEqual(preferences);
  expect(storage.saveDiscoveryPreferences).toHaveBeenCalledWith(preferences);
  expect(mockUpdateDiscoveryPreferences).toHaveBeenCalledWith(preferences);
});
