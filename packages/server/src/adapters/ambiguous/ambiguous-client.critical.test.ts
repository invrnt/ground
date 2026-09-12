import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AmbiguousClient } from './ambiguous-client';

const workspace = '11111111-1111-4111-8111-111111111111';
const file = '22222222-2222-4222-8222-222222222222';
const bytes = new Uint8Array([255, 216, 255, 217]);
const digest = createHash('sha256').update(bytes).digest('hex');

function fixture(location: string, content = bytes) {
  const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, init });
    if (url.endsWith('/api/users/me')) return Response.json({ workspace_id: workspace });
    if (url.endsWith(`/api/drive/${file}`)) return Response.json({ id: file, name: 'photo.jpg', mime_type: 'image/jpeg', size_bytes: bytes.length });
    if (url.endsWith('/content')) return new Response(null, { status: 302, headers: { location } });
    return new Response(content);
  };
  return { requests, client: new AmbiguousClient({ token: 'test-token', workspace_id: workspace }, fetcher) };
}

describe('Ambiguous private evidence download', () => {
  it('verifies redirected bytes without disclosing the API token to storage', async () => {
    const target = 'https://storage.googleapis.com/test-bucket/photo?signature=test';
    const { client, requests } = fixture(target);
    expect(await client.verifyFile(file, bytes.length, 'image/jpeg', digest)).toBe(true);
    const download = requests.find(request => request.url === target);
    expect(download).toBeDefined();
    expect(new Headers(download?.init?.headers).has('Authorization')).toBe(false);
    expect(download?.init?.redirect).toBe('error');
  });

  it.each(['https://attacker.example/photo', 'http://storage.googleapis.com/photo', 'https://user:password@storage.googleapis.com/photo'])(
    'rejects an untrusted redirect: %s', async target => {
      const { client, requests } = fixture(target);
      await expect(client.verifyFile(file, bytes.length, 'image/jpeg', digest)).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
      expect(requests.some(request => request.url === target)).toBe(false);
    },
  );

  it('rejects downloaded content whose hash differs from the original', async () => {
    const { client } = fixture('https://storage.googleapis.com/test/photo', new Uint8Array([0, 0, 0, 0]));
    expect(await client.verifyFile(file, bytes.length, 'image/jpeg', digest)).toBe(false);
  });
});
