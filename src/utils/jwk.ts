import crypto from 'crypto';
import type { Prisma } from '@prisma/client';

export type NodeJwk = {
  kty: string;
  crv?: string;
  x?: string;
  y?: string;
  n?: string;
  e?: string;
  kid?: string;
  alg?: string;
  use?: string;
  key_ops?: string[];
  [key: string]: unknown;
};

export const isNodeJwk = (value: unknown): value is NodeJwk => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.kty === 'string';
};

export const prismaJsonToNodeJwk = (value: Prisma.JsonValue): NodeJwk => {
  if (!isNodeJwk(value)) {
    throw new Error('Invalid JWK format');
  }
  return value;
};

export const verifyEs256JwkSignature = (params: {
  publicKeyJwk: Prisma.JsonValue;
  message: string;
  signatureB64Url: string;
}): boolean => {
  const jwk = prismaJsonToNodeJwk(params.publicKeyJwk);

  const keyObject = crypto.createPublicKey({
    key: jwk as crypto.JsonWebKey,
    format: 'jwk',
  });

  const signature = Buffer.from(params.signatureB64Url, 'base64url');
  const data = Buffer.from(params.message, 'utf8');

  return crypto.verify('sha256', data, keyObject, signature);
};

export const randomBase64Url = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('base64url');
};
