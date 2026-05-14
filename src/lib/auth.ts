import { auth } from '@clerk/nextjs/server';

export async function getVerifiedUid(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function requireUid(): Promise<string> {
  const uid = await getVerifiedUid();
  if (!uid) {
    throw new Error('Unauthorized');
  }
  return uid;
}
