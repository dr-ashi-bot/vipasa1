import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = 'vipasa:user_id';

function pseudoUuid(): string {
  // Good enough for local MVP (backend expects UUID format; we mimic v4 shape).
  const hex = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `${hex().slice(0, 8)}-${hex().slice(0, 4)}-4${hex().slice(0, 3)}-a${hex().slice(
    0,
    3,
  )}-${hex()}${hex().slice(0, 4)}`;
}

export async function getOrCreateUserId(): Promise<string> {
  const existing = await AsyncStorage.getItem(USER_ID_KEY);
  if (existing) return existing;
  const created = pseudoUuid();
  await AsyncStorage.setItem(USER_ID_KEY, created);
  return created;
}

