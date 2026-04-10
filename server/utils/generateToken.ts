import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { getJwtExpire, getJwtSecret } from './env.ts';

const generateToken = (id: string, role: string) => {
  const options: SignOptions = {
    expiresIn: getJwtExpire() as any,
  };
  return jwt.sign({ id, role }, getJwtSecret(), options);
};

export default generateToken;
