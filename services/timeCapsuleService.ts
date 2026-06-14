import { TimeCapsulePayload } from '../types';

const STORAGE_KEY = 'fix-your-life.time-capsules';

export const saveTimeCapsule = async (payload: TimeCapsulePayload): Promise<{ id: string; storedLocally: boolean }> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'time-capsule',
        ...payload,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        id: data.id || `${Date.now()}`,
        storedLocally: Boolean(data.storedLocally),
      };
    }
  } catch (e) {
    console.warn('Time capsule API unavailable. Saving locally for demo mode.', e);
  }

  const existing = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
  const id = `local-${Date.now()}`;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      ...existing,
      {
        id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...payload,
      },
    ]),
  );

  return { id, storedLocally: true };
};
