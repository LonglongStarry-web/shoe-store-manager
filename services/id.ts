// Date + random suffix also works in older WebViews without crypto.randomUUID.
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
