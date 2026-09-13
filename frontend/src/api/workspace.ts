const WORKSPACE_ID_KEY = "spade.workspaceId";

export function getWorkspaceId(): string {
  const existingId = window.localStorage.getItem(WORKSPACE_ID_KEY);
  if (existingId) return existingId;

  const workspaceId = window.crypto.randomUUID();
  window.localStorage.setItem(WORKSPACE_ID_KEY, workspaceId);
  return workspaceId;
}
