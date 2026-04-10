import { User } from '../types';

const parseJson = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('[storage] Failed to parse JSON value', error);
    return null;
  }
};

export const getStoredUser = (): User | null => parseJson<User>(localStorage.getItem('evento_user'));
