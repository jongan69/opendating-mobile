// Photo upload via Blossom (BUD-02).
//
// Photos are picked from the device as `file://` URIs, which mean nothing to
// anyone else. They have to be uploaded before a profile is published or
// every card would render blank for other members.
//
// Authorization is a signed kind-24242 event rather than a server-issued
// token: the same key that owns the account authorizes the upload, so there
// is no session to establish and nothing for the server to store.

import { signEvent } from 'opendating-protocol';
import type { CandidatePhoto } from '@/types/opendating';

/** Blossom authorization event kind. */
const BLOSSOM_AUTH_KIND = 24242;
/** Keep authorizations short-lived — they are bearer credentials once signed. */
const AUTH_LIFETIME_SEC = 300;

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
};

export interface UploadedBlob {
  url: string;
  sha256: string;
  size: number;
  type: string;
}

function guessMimeType(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXTENSION[ext] ?? 'image/jpeg';
}

/** True for a URI already hosted somewhere fetchable. */
export function isRemote(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return globalThis.btoa(binary);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function buildAuthHeader(
  privkey: string,
  pubkey: string,
  hash: string,
  verb: 'upload' | 'delete',
): string {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = {
    pubkey,
    created_at: now,
    kind: BLOSSOM_AUTH_KIND,
    // The `x` tag binds this authorization to one specific blob, so it cannot
    // be reused to store different content.
    tags: [
      ['t', verb],
      ['x', hash],
      ['expiration', String(now + AUTH_LIFETIME_SEC)],
    ],
    content: '',
  };
  const { id, sig } = signEvent(unsigned, privkey);
  return `Nostr ${globalThis.btoa(JSON.stringify({ ...unsigned, id, sig }))}`;
}

/**
 * Upload one local photo, returning its hosted URL.
 *
 * The server recomputes the hash and rejects a mismatch, so a corrupted
 * transfer fails loudly rather than storing a broken image.
 */
export async function uploadPhoto(
  localUri: string,
  mediaOrigin: string,
  privkey: string,
  pubkey: string,
): Promise<UploadedBlob> {
  const response = await fetch(localUri);
  if (!response.ok) throw new Error('Could not read the selected photo.');

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0) throw new Error('That photo appears to be empty.');

  const hash = await sha256Hex(bytes);
  const type = guessMimeType(localUri);

  const upload = await fetch(`${mediaOrigin}/upload`, {
    method: 'PUT',
    headers: {
      'Content-Type': type,
      Authorization: buildAuthHeader(privkey, pubkey, hash, 'upload'),
    },
    body: bytes as BodyInit,
  });

  if (!upload.ok) {
    if (upload.status === 503) {
      throw new Error('Photo uploads are not available on this relay yet.');
    }
    if (upload.status === 413) {
      throw new Error('That photo is too large. Please choose a smaller one.');
    }
    if (upload.status === 415) {
      throw new Error('That image format is not supported.');
    }
    const reason = upload.headers.get('X-Reason');
    throw new Error(reason || 'Could not upload that photo. Please try again.');
  }

  const blob = (await upload.json()) as UploadedBlob;
  if (!blob?.url) throw new Error('The photo server returned an unexpected response.');
  return blob;
}

/**
 * Upload any local photos and return the list with hosted URLs.
 *
 * Photos already hosted are passed through untouched, so re-saving a profile
 * does not re-upload everything. `toBase64` is retained for callers that need
 * a data URI fallback.
 */
export async function uploadPendingPhotos(
  photos: CandidatePhoto[],
  mediaOrigin: string,
  privkey: string,
  pubkey: string,
): Promise<CandidatePhoto[]> {
  const out: CandidatePhoto[] = [];

  for (const [index, photo] of photos.entries()) {
    if (isRemote(photo.url)) {
      out.push({ ...photo, order: index });
      continue;
    }
    const blob = await uploadPhoto(photo.url, mediaOrigin, privkey, pubkey);
    out.push({ id: blob.sha256, url: blob.url, order: index });
  }

  return out;
}

export { toBase64 };
