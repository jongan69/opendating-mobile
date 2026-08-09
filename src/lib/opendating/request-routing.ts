import type { OpenDatingServiceRole } from '@/types/opendating';

/**
 * Protocol 0.1 request routing metadata.
 *
 * This mirrors opendating-protocol 0.1.1 so request callers cannot silently
 * choose a different service from the contract. It can be replaced by the
 * package export as soon as 0.1.1 is available from the registry.
 */
export const REQUEST_ROUTES = {
  'system.ping': { role: 'system', resultType: 'system.pong' },
  'profile.create': { role: 'profile', resultType: 'profile.create.result' },
  'profile.update': { role: 'profile', resultType: 'profile.update.result' },
  'profile.get': { role: 'profile', resultType: 'profile.get.result' },
  'profile.pause': { role: 'profile', resultType: 'profile.pause.result' },
  'profile.resume': { role: 'profile', resultType: 'profile.resume.result' },
  'profile.delete': { role: 'profile', resultType: 'profile.delete.result' },
  'visibility.update': { role: 'profile', resultType: 'visibility.update.result' },
  'discovery.update_location': {
    role: 'discovery',
    resultType: 'discovery.update_location.result',
  },
  'discovery.update_preferences': {
    role: 'discovery',
    resultType: 'discovery.update_preferences.result',
  },
  'discovery.get_candidates': {
    role: 'discovery',
    resultType: 'discovery.get_candidates.result',
  },
  'intent.like': { role: 'matcher', resultType: 'intent.like.result' },
  'intent.revoke': { role: 'matcher', resultType: 'intent.revoke.result' },
  'match.list': { role: 'matcher', resultType: 'match.list.result' },
  'block.create': { role: 'dm_policy', resultType: 'block.create.result' },
  'block.remove': { role: 'dm_policy', resultType: 'block.remove.result' },
  'block.list': { role: 'dm_policy', resultType: 'block.list.result' },
  'unmatch.create': { role: 'dm_policy', resultType: 'unmatch.create.result' },
  'report.create': { role: 'moderation', resultType: 'report.create.result' },
  'verification.list': {
    role: 'verification',
    resultType: 'verification.list.result',
  },
  'account.delete': { role: 'deletion', resultType: 'account.delete.result' },
} as const satisfies Record<
  string,
  { role: OpenDatingServiceRole; resultType: string }
>;

export type ClientRequestType = keyof typeof REQUEST_ROUTES;

export function getRequestRoute(type: ClientRequestType) {
  return REQUEST_ROUTES[type];
}
