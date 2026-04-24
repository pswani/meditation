import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const screenshotRoot = resolve(repoRoot, 'docs/review-artifacts/screenshots/web');
const appUrl = process.env.MEDITATION_QA_WEB_URL ?? 'http://127.0.0.1:5173/';
const chromePath =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const remoteDebuggingPort = Number(process.env.MEDITATION_QA_CHROME_PORT ?? 9223);
const userDataDir = process.env.MEDITATION_QA_CHROME_PROFILE ?? '/tmp/meditation-web-qa-chrome';

let nextId = 1;

function wait(ms) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

async function fetchJson(url, init = undefined) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${url}`);
  }
  return response.json();
}

async function waitForDevTools() {
  const versionUrl = `http://127.0.0.1:${remoteDebuggingPort}/json/version`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      return await fetchJson(versionUrl);
    } catch {
      await wait(250);
    }
  }
  throw new Error('Chrome DevTools endpoint did not become ready.');
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.pending = new Map();
    this.events = [];
  }

  async open() {
    await new Promise((resolveOpen, rejectOpen) => {
      this.ws.addEventListener('open', resolveOpen, { once: true });
      this.ws.addEventListener('error', rejectOpen, { once: true });
    });

    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolveCommand, rejectCommand } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          rejectCommand(new Error(message.error.message));
        } else {
          resolveCommand(message.result);
        }
        return;
      }
      this.events.push(message);
    });
  }

  send(method, params = {}) {
    const id = nextId;
    nextId += 1;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveCommand, rejectCommand) => {
      this.pending.set(id, { resolveCommand, rejectCommand });
    });
  }

  close() {
    this.ws.close();
  }
}

async function connectToPage() {
  await waitForDevTools();
  const pageTarget = await fetchJson(
    `http://127.0.0.1:${remoteDebuggingPort}/json/new?${encodeURIComponent(appUrl)}`,
    { method: 'PUT' }
  );
  const client = new CdpClient(pageTarget.webSocketDebuggerUrl);
  await client.open();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('DOM.enable');
  return client;
}

async function evaluate(client, expression, awaitPromise = true) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text);
  }
  return result.result.value;
}

function pageScript(inner) {
  return `(() => {
${inner}
})()`;
}

async function waitForText(client, text, timeoutMs = 8000) {
  const escaped = JSON.stringify(text);
  const found = await evaluate(
    client,
    pageScript(`
      return new Promise((resolveWait) => {
        const deadline = Date.now() + ${timeoutMs};
        const tick = () => {
          if (document.body?.innerText.includes(${escaped})) {
            resolveWait(true);
            return;
          }
          if (Date.now() > deadline) {
            resolveWait(false);
            return;
          }
          setTimeout(tick, 100);
        };
        tick();
      });
    `)
  );
  if (!found) {
    throw new Error(`Timed out waiting for text: ${text}`);
  }
}

async function hasText(client, text) {
  const escaped = JSON.stringify(text);
  return evaluate(
    client,
    pageScript(`
      return Boolean(document.body?.innerText.includes(${escaped}));
    `)
  );
}

async function waitForIdle(client) {
  await evaluate(
    client,
    pageScript(`
      return new Promise((resolveIdle) => {
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolveIdle, 250)));
      });
    `)
  );
}

async function setViewport(client, width, height, mobile = false) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: mobile ? 3 : 1,
    mobile,
  });
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  await waitForIdle(client);
}

async function navigate(client, path = '/') {
  const url = new URL(path, appUrl).toString();
  await client.send('Page.navigate', { url });
  await waitForText(client, 'Home');
  await waitForIdle(client);
}

async function screenshot(client, relativePath, fullPage = true) {
  const outPath = resolve(screenshotRoot, relativePath);
  await mkdir(dirname(outPath), { recursive: true });
  let params = { format: 'png', fromSurface: true };

  if (fullPage) {
    const { contentSize } = await client.send('Page.getLayoutMetrics');
    params = {
      ...params,
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: 0,
        width: Math.ceil(contentSize.width),
        height: Math.ceil(contentSize.height),
        scale: 1,
      },
    };
  }

  const result = await client.send('Page.captureScreenshot', params);
  await BunWriteFile(outPath, result.data);
  return outPath;
}

async function BunWriteFile(outPath, base64Data) {
  const { writeFile } = await import('node:fs/promises');
  await writeFile(outPath, Buffer.from(base64Data, 'base64'));
}

async function pageAction(client, inner) {
  await evaluate(
    client,
    pageScript(`
      const normalize = (value) => String(value ?? '').replace(/\\s+/g, ' ').trim();
      const byText = (selector, text) => {
        const target = normalize(text).toLowerCase();
        return [...document.querySelectorAll(selector)].find((node) => normalize(node.innerText || node.textContent).toLowerCase() === target)
          ?? [...document.querySelectorAll(selector)].find((node) => normalize(node.innerText || node.textContent).toLowerCase().includes(target));
      };
      const inputByLabel = (labelText) => {
        const target = normalize(labelText).toLowerCase();
        const labels = [...document.querySelectorAll('label')];
        const label = labels.find((entry) => normalize(entry.querySelector('span')?.innerText ?? entry.innerText).toLowerCase().includes(target));
        if (!label) throw new Error('Label not found: ' + labelText);
        const control = label.querySelector('input, select, textarea');
        if (!control) throw new Error('Control not found for label: ' + labelText);
        return control;
      };
      const setValue = (control, value) => {
        const proto = control instanceof HTMLSelectElement
          ? HTMLSelectElement.prototype
          : control instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
        descriptor.set.call(control, String(value));
        control.dispatchEvent(new Event('input', { bubbles: true }));
        control.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const clickText = (selector, text) => {
        const node = byText(selector, text);
        if (!node) throw new Error('Clickable not found: ' + text);
        node.scrollIntoView({ block: 'center', inline: 'center' });
        node.click();
        return true;
      };
      const setByLabel = (labelText, value) => {
        const control = inputByLabel(labelText);
        control.scrollIntoView({ block: 'center', inline: 'center' });
        setValue(control, value);
        control.blur();
        return true;
      };
      const selectByLabel = (labelText, visibleText) => {
        const control = inputByLabel(labelText);
        const target = normalize(visibleText).toLowerCase();
        const option = [...control.options].find((entry) => normalize(entry.textContent).toLowerCase().includes(target));
        if (!option) throw new Error('Option not found: ' + visibleText + ' for ' + labelText);
        setValue(control, option.value);
        control.blur();
        return true;
      };
${inner}
    `)
  );
  await waitForIdle(client);
}

async function click(client, selector, text) {
  await pageAction(client, `return clickText(${JSON.stringify(selector)}, ${JSON.stringify(text)});`);
}

async function setByLabel(client, label, value) {
  await pageAction(client, `return setByLabel(${JSON.stringify(label)}, ${JSON.stringify(value)});`);
}

async function selectByLabel(client, label, value) {
  await pageAction(client, `return selectByLabel(${JSON.stringify(label)}, ${JSON.stringify(value)});`);
}

async function clearStorage(client) {
  await evaluate(
    client,
    pageScript(`
      localStorage.clear();
      sessionStorage.clear();
      return true;
    `)
  );
}

async function captureWebReview() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--window-size=390,844',
    appUrl,
  ], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  chrome.stderr.on('data', () => {});
  const client = await connectToPage();

  try {
    await setViewport(client, 390, 844, true);
    await navigate(client, '/');
    await clearStorage(client);
    await navigate(client, '/');
    await screenshot(client, 'home/01-phone-empty-home.png');

    await navigate(client, '/practice');
    await screenshot(client, 'meditation/01-phone-timer-setup-default.png');
    await click(client, 'button', 'Show Advanced Options');
    await screenshot(client, 'meditation/02-phone-timer-advanced-closed-open.png');
    await pageAction(client, `
      const checkbox = [...document.querySelectorAll('label')].find((node) => normalize(node.innerText).toLowerCase().includes('enable interval bell'))?.querySelector('input');
      if (!checkbox) throw new Error('Interval checkbox not found');
      checkbox.click();
      return true;
    `);
    await setByLabel(client, 'Interval bell every', '30');
    await click(client, 'button', 'Start Session');
    await screenshot(client, 'meditation/03-phone-interval-validation-error.png');
    await setByLabel(client, 'Interval bell every', '5');
    await selectByLabel(client, 'Meditation type', 'Vipassana');
    await click(client, 'button', 'Start Session');
    await waitForText(client, 'Active Timer');
    await screenshot(client, 'meditation/04-phone-active-fixed-timer.png');
    await click(client, 'button', 'Pause');
    await screenshot(client, 'meditation/05-phone-active-fixed-paused.png');
    await click(client, 'button', 'Resume');
    await click(client, 'button', 'End Early');
    await screenshot(client, 'meditation/06-phone-end-timer-confirmation.png');
    await click(client, 'button', 'Continue Session');
    await screenshot(client, 'meditation/07-phone-end-timer-cancelled.png');
    await click(client, 'button', 'End Early');
    await pageAction(client, `
      const confirmButton = [...document.querySelectorAll('.confirm-sheet button')].find((node) => normalize(node.innerText).toLowerCase() === 'end early');
      if (!confirmButton) throw new Error('Confirm End Early button not found');
      confirmButton.click();
      return true;
    `);
    await waitForText(client, 'Start Another Session');
    await screenshot(client, 'meditation/08-phone-ended-early-feedback.png');
    await click(client, 'button', 'Start Another Session');
    await waitForText(client, 'Timer Setup');

    await navigate(client, '/practice');
    await pageAction(client, `
      const openEnded = [...document.querySelectorAll('label')].find((node) => normalize(node.innerText).toLowerCase().includes('open-ended'));
      if (!openEnded) throw new Error('Open-ended option not found');
      openEnded.querySelector('input').click();
      return true;
    `);
    await selectByLabel(client, 'Meditation type', 'Vipassana');
    await screenshot(client, 'meditation/09-phone-open-ended-setup.png');
    await click(client, 'button', 'Start Open-Ended Session');
    await waitForText(client, 'Active Timer');
    await screenshot(client, 'meditation/10-phone-active-open-ended.png');
    await click(client, 'button', 'End Session');
    await screenshot(client, 'meditation/11-phone-open-ended-end-confirmation.png');
    await pageAction(client, `
      const confirmButton = [...document.querySelectorAll('.confirm-sheet button')].find((node) => normalize(node.innerText).toLowerCase() === 'end session');
      if (!confirmButton) throw new Error('Confirm End Session button not found');
      confirmButton.click();
      return true;
    `);
    await waitForText(client, 'Start Another Session');
    await click(client, 'button', 'Start Another Session');
    await waitForText(client, 'Timer Setup');

    await navigate(client, '/history');
    await screenshot(client, 'history/01-phone-history-populated.png');
    await click(client, 'summary', 'Add Manual Log');
    await screenshot(client, 'history/02-phone-manual-log-form.png');
    await setByLabel(client, 'Duration', '0');
    await click(client, 'button', 'Save Manual Log');
    await screenshot(client, 'history/03-phone-manual-log-validation-error.png');
    await setByLabel(client, 'Duration', '12');
    await selectByLabel(client, 'Meditation type', 'Kriya');
    await click(client, 'button', 'Save Manual Log');
    await waitForText(client, 'Manual log saved to history.');
    await screenshot(client, 'history/04-phone-manual-log-success.png');
    await click(client, 'button', 'Change Meditation Type');
    await screenshot(client, 'history/05-phone-manual-log-edit-type.png');
    await selectByLabel(client, 'Meditation type', 'Ajapa');
    await click(client, 'button', 'Save Meditation Type');
    await screenshot(client, 'history/06-phone-manual-log-edit-success.png');
    await selectByLabel(client, 'Source filter', 'Manual log only');
    await screenshot(client, 'history/07-phone-history-filtered-manual.png');
    await selectByLabel(client, 'Status filter', 'Ended early only');
    await screenshot(client, 'history/08-phone-history-filter-empty.png');

    await navigate(client, '/practice');
    await click(client, 'button', 'Show Tools');
    await screenshot(client, 'custom-plays/01-phone-tools-open-empty.png');
    await screenshot(client, 'custom-plays/02-phone-library-empty-form.png');
    await click(client, 'button', 'Create Custom Play');
    await screenshot(client, 'custom-plays/03-phone-create-validation-error.png');
    await setByLabel(client, 'Custom play name', 'QA Vipassana Play');
    await selectByLabel(client, 'Custom play meditation type', 'Vipassana');
    await selectByLabel(client, 'Linked media session', 'Vipassana');
    await selectByLabel(client, 'Custom play start sound', 'Temple Bell');
    await selectByLabel(client, 'Custom play end sound', 'Gong');
    await setByLabel(client, 'Session note', 'QA capture');
    await screenshot(client, 'custom-plays/04-phone-create-populated-form.png');
    await click(client, 'button', 'Create Custom Play');
    await waitForText(client, 'QA Vipassana Play');
    await screenshot(client, 'custom-plays/05-phone-create-success-populated-library.png');
    await click(client, 'button', 'Edit');
    await screenshot(client, 'custom-plays/06-phone-edit-form.png');
    await click(client, 'button', 'Cancel Edit');
    await click(client, 'button', 'Favorite');
    await screenshot(client, 'custom-plays/07-phone-favorite-toggled.png');
    await click(client, 'button', 'Start Custom Play');
    await waitForIdle(client);
    if ((await hasText(client, 'End Early')) && (await hasText(client, 'QA Vipassana Play'))) {
      await screenshot(client, 'custom-plays/08-phone-active-custom-play.png');
      await click(client, 'button', 'Pause');
      await screenshot(client, 'custom-plays/09-phone-active-custom-play-paused.png');
      await click(client, 'button', 'Resume');
      await click(client, 'button', 'End Early');
      await screenshot(client, 'custom-plays/10-phone-end-custom-play-confirmation.png');
      await pageAction(client, `
        const confirmButton = [...document.querySelectorAll('.confirm-sheet button')].find((node) => normalize(node.innerText).toLowerCase() === 'end early');
        if (!confirmButton) throw new Error('Confirm custom play End Early button not found');
        confirmButton.click();
        return true;
      `);
      await waitForText(client, 'Custom Play Ended Early');
      await click(client, 'button', 'Back To Practice');
      await waitForText(client, 'Timer Setup');
      await click(client, 'button', 'Show Tools');
    } else {
      await screenshot(client, 'custom-plays/08-phone-start-blocked-or-not-routed.png');
    }
    await click(client, 'button', 'Delete');
    await screenshot(client, 'custom-plays/11-phone-delete-confirmation.png');
    await click(client, 'button', 'Keep Custom Play');

    await navigate(client, '/practice/playlists');
    await screenshot(client, 'playlists/01-phone-playlist-empty-form.png');
    await click(client, 'button', 'Create Playlist');
    await screenshot(client, 'playlists/02-phone-create-validation-error.png');
    await setByLabel(client, 'Playlist name', 'QA Morning Sequence');
    await selectByLabel(client, 'Small gap between items', '15 second');
    await selectByLabel(client, 'Item 1 meditation type', 'Ajapa');
    await setByLabel(client, 'Item 1 duration', '8');
    await click(client, 'button', 'Add Item');
    await selectByLabel(client, 'Item 2 linked custom play', 'QA Vipassana Play');
    await screenshot(client, 'playlists/03-phone-create-populated-form.png');
    await click(client, 'button', 'Create Playlist');
    await waitForText(client, 'QA Morning Sequence');
    await screenshot(client, 'playlists/04-phone-create-success-populated-library.png');
    await click(client, 'button', 'Edit');
    await screenshot(client, 'playlists/05-phone-edit-form.png');
    await click(client, 'button', 'Cancel Edit');
    await click(client, 'button', 'Favorite');
    await screenshot(client, 'playlists/06-phone-favorite-toggled.png');
    await click(client, 'button', 'Run Playlist');
    await waitForText(client, 'Playlist Run');
    await screenshot(client, 'playlists/07-phone-active-playlist.png');
    await click(client, 'button', 'Pause');
    await screenshot(client, 'playlists/08-phone-active-playlist-paused.png');
    await click(client, 'button', 'Resume');
    await click(client, 'button', 'End Early');
    await screenshot(client, 'playlists/09-phone-end-playlist-confirmation.png');
    await pageAction(client, `
      const confirmButton = [...document.querySelectorAll('.confirm-sheet button')].find((node) => normalize(node.innerText).toLowerCase() === 'end early');
      if (!confirmButton) throw new Error('Confirm playlist End Early button not found');
      confirmButton.click();
      return true;
    `);
    await waitForText(client, 'Playlist Ended Early');
    await click(client, 'button', 'Back To Playlists');
    await waitForText(client, 'Playlists');
    await click(client, 'button', 'Delete');
    await screenshot(client, 'playlists/10-phone-delete-confirmation.png');
    await click(client, 'button', 'Keep Playlist');

    await navigate(client, '/goals');
    await screenshot(client, 'goals/01-phone-summary-and-empty-goals.png');
    await selectByLabel(client, 'Summary range', 'Custom range');
    await screenshot(client, 'goals/02-phone-summary-custom-range.png');
    await setByLabel(client, 'Target duration', '0');
    await setByLabel(client, 'Days', '0');
    await click(client, 'button', 'Create Sankalpa');
    await screenshot(client, 'goals/03-phone-create-validation-error.png');
    await setByLabel(client, 'Target duration', '30');
    await setByLabel(client, 'Days', '7');
    await selectByLabel(client, 'Meditation type filter', 'Ajapa');
    await selectByLabel(client, 'Time-of-day filter', 'Morning');
    await screenshot(client, 'goals/04-phone-create-populated-duration-goal.png');
    await click(client, 'button', 'Create Sankalpa');
    await waitForText(client, 'Sankalpa created');
    await screenshot(client, 'goals/05-phone-duration-goal-created.png');
    await click(client, 'button', 'Edit');
    await screenshot(client, 'goals/06-phone-edit-sankalpa.png');
    await click(client, 'button', 'Cancel Edit');
    await click(client, 'button', 'Start Gym Sankalpa');
    await screenshot(client, 'goals/07-phone-gym-sankalpa-preset.png');
    await click(client, 'button', 'Create Sankalpa');
    await waitForText(client, 'Gym');
    await screenshot(client, 'goals/08-phone-observance-goal-created.png');
    await pageAction(client, `
      const observanceSelect = [...document.querySelectorAll('.observance-row select')].find((entry) => !entry.disabled);
      if (!observanceSelect) throw new Error('Enabled observance select not found');
      setValue(observanceSelect, 'observed');
      return true;
    `);
    await screenshot(client, 'goals/09-phone-observance-marked-observed.png');
    await pageAction(client, `
      const observanceSelect = [...document.querySelectorAll('.observance-row select')].find((entry) => !entry.disabled);
      if (!observanceSelect) throw new Error('Enabled observance select not found');
      setValue(observanceSelect, 'missed');
      return true;
    `);
    await screenshot(client, 'goals/10-phone-observance-marked-missed.png');
    await click(client, 'button', 'Archive');
    await screenshot(client, 'goals/11-phone-archive-confirmation.png');
    await click(client, 'button', 'Archive Sankalpa');
    await waitForText(client, 'Sankalpa archived');
    await screenshot(client, 'goals/12-phone-archived-goal.png');
    await click(client, 'button', 'Unarchive');
    await waitForText(client, 'Sankalpa restored');
    await screenshot(client, 'goals/13-phone-unarchive-success.png');

    await navigate(client, '/settings');
    await screenshot(client, 'settings/01-phone-settings-default.png');
    await setByLabel(client, 'Default duration', '0');
    await click(client, 'button', 'Save Defaults');
    await screenshot(client, 'settings/02-phone-settings-validation-error.png');
    await setByLabel(client, 'Default duration', '10');
    await selectByLabel(client, 'Default meditation type', 'Sahaj');
    await click(client, 'button', 'Save Defaults');
    await screenshot(client, 'settings/03-phone-settings-save-success.png');

    await navigate(client, '/');
    await screenshot(client, 'home/02-phone-populated-home.png');

    await setViewport(client, 1280, 900, false);
    await navigate(client, '/');
    await screenshot(client, 'responsive/01-desktop-home.png');
    await navigate(client, '/practice');
    await screenshot(client, 'responsive/02-desktop-practice.png');
    await navigate(client, '/history');
    await screenshot(client, 'responsive/03-desktop-history.png');
    await navigate(client, '/goals');
    await screenshot(client, 'responsive/04-desktop-goals.png');
    await navigate(client, '/settings');
    await screenshot(client, 'responsive/05-desktop-settings.png');

    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    }).catch(() => {});
  } finally {
    client.close();
    chrome.kill('SIGTERM');
  }
}

captureWebReview().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
