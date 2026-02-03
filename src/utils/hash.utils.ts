import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS) || SALT_ROUNDS;
  return await bcrypt.hash(password, rounds);
};

export const comparePasswords = async (
  plain: string,
  hashed: string
): Promise<boolean> => {
  return await bcrypt.compare(plain, hashed);
};
