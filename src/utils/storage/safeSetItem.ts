export type StorageWriteResult = 'ok' | 'quota-exceeded' | 'error';

export function safeSetItem(key: string, value: string): StorageWriteResult {
  try {
    localStorage.setItem(key, value);
    return 'ok';
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      window.dispatchEvent(new CustomEvent('meditation:storage-quota-exceeded'));
      return 'quota-exceeded';
    }
    return 'error';
  }
}
