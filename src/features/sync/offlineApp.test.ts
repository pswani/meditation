import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectOfflineAppCacheUrls, precacheUrlsForOffline, registerOfflineAppServiceWorker } from './offlineApp';

function stubServiceWorkerApi(overrides?: {
  readonly controller?: Pick<ServiceWorker, 'postMessage'> | null;
  readonly registration?: ServiceWorkerRegistration;
}) {
  const postMessage = vi.fn();
  const registration =
    overrides?.registration ??
    ({
      active: { postMessage },
      waiting: null,
      installing: null,
    } as unknown as ServiceWorkerRegistration);

  Object.defineProperty(window.navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller: overrides?.controller ?? null,
      register: vi.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
    },
  });

  return {
    postMessage,
    register: window.navigator.serviceWorker.register as unknown as ReturnType<typeof vi.fn>,
  };
}

describe('offline app helper', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('collects same-origin shell and asset urls for offline caching', () => {
    document.head.innerHTML = `
      <link rel="stylesheet" href="/assets/app.css" />
      <script type="module" src="/assets/app.js"></script>
      <link rel="stylesheet" href="https://example.com/external.css" />
    `;
    document.body.innerHTML = `
      <img src="/media/custom-plays/sit-20.png" />
    `;

    const urls = collectOfflineAppCacheUrls();

    expect(urls).toContain('/');
    expect(urls).toContain('/manifest.webmanifest');
    expect(urls).toContain('/assets/app.css');
    expect(urls).toContain('/assets/app.js');
    expect(urls).toContain('/media/custom-plays/sit-20.png');
    expect(urls.some((url) => url.includes('example.com'))).toBe(false);
  });

  it('registers the service worker and immediately queues shell urls for caching', async () => {
    const controller = { postMessage: vi.fn() } as Pick<ServiceWorker, 'postMessage'>;
    const { register } = stubServiceWorkerApi({ controller });

    document.head.innerHTML = '<script type="module" src="/assets/app.js"></script>';

    await registerOfflineAppServiceWorker();

    expect(register).toHaveBeenCalledWith(expect.stringMatching(/^\/offline-sw\.js\?v=/));
    expect(controller.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CACHE_URLS',
      })
    );
  });

  it('posts normalized urls through the ready service worker when no controller exists yet', async () => {
    const postMessage = vi.fn();
    stubServiceWorkerApi({
      registration: {
        active: { postMessage },
        waiting: null,
        installing: null,
      } as unknown as ServiceWorkerRegistration,
    });

    const sent = await precacheUrlsForOffline([
      '/assets/app.js',
      'https://example.com/not-allowed.js',
      `${window.location.origin}/media/custom-plays/sit-20.mp3`,
    ]);

    expect(sent).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({
      type: 'CACHE_URLS',
      payload: {
        urls: ['/assets/app.js', '/media/custom-plays/sit-20.mp3'],
      },
    });
  });
});
