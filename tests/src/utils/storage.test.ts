import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  clearStoredAuth,
  getStoredUser,
  storeAuthSession,
} from '../../../src/utils/storage.ts';

type StorageMap = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const globalScope = globalThis as {
  window?: {
    localStorage: StorageMap;
    dispatchEvent?: (...args: unknown[]) => boolean;
  };
};

const originalWindow = globalScope.window;

const createStorage = () => {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  } satisfies StorageMap;
};

afterEach(() => {
  if (originalWindow) {
    globalScope.window = originalWindow;
    return;
  }

  delete globalScope.window;
});

describe('storage utils', () => {
  it('returns null when localStorage is unavailable', () => {
    delete globalScope.window;
    assert.equal(getStoredUser(), null);
  });

  it('stores only the user payload and clears legacy token state', () => {
    const localStorage = createStorage();

    globalScope.window = {
      localStorage,
      dispatchEvent: () => true,
    };

    localStorage.setItem('evento_token', 'legacy-token');
    storeAuthSession({
      _id: 'user-1',
      name: 'Evento User',
      email: 'user@example.com',
      role: 'user',
    });

    assert.equal(localStorage.getItem('evento_token'), null);
    assert.deepEqual(JSON.parse(localStorage.getItem('evento_user') || '{}'), {
      _id: 'user-1',
      name: 'Evento User',
      email: 'user@example.com',
      role: 'user',
    });

    clearStoredAuth();
    assert.equal(localStorage.getItem('evento_user'), null);
    assert.equal(localStorage.getItem('evento_token'), null);
  });
});
