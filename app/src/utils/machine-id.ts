export async function getMachineId(): Promise<string> {
  // 1. Try Electron API
  try {
    const id = await (window as any).electronAPI?.getMachineId();
    if (id) return id.toUpperCase();
  } catch (e) {}

  // 2. Try localStorage for Browser
  const storedId = localStorage.getItem('formease-browser-id');
  if (storedId) return storedId;

  // 3. Generate new persistent Browser ID
  const newId = 'BROWSER-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  localStorage.setItem('formease-browser-id', newId);
  return newId;
}
