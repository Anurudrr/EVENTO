const subscribers = new Map<string, Set<any>>();

const buildEventChunk = (event: string, payload: unknown) => (
  `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`
);

export const subscribeToNotificationStream = (userId: string, res: any) => {
  const existing = subscribers.get(userId) || new Set();
  existing.add(res);
  subscribers.set(userId, existing);

  res.write(buildEventChunk('ready', { connected: true, userId, at: new Date().toISOString() }));

  const keepAliveId = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (error) {
      clearInterval(keepAliveId);
    }
  }, 15000);

  return () => {
    clearInterval(keepAliveId);
    const current = subscribers.get(userId);
    if (!current) {
      return;
    }

    current.delete(res);
    if (current.size === 0) {
      subscribers.delete(userId);
    }
  };
};

export const pushNotificationStreamEvent = (userId: string, payload: unknown, event = 'notification') => {
  const targets = subscribers.get(userId);

  if (!targets?.size) {
    return;
  }

  const chunk = buildEventChunk(event, payload);

  targets.forEach((res) => {
    try {
      res.write(chunk);
    } catch (error) {
      const current = subscribers.get(userId);
      current?.delete(res);
    }
  });
};
