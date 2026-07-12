let workspaceExpiry = 0;

export function setWorkspaceExpiry(expiry: number) {
  workspaceExpiry = expiry;
}

export function getWorkspaceExpiry() {
  return workspaceExpiry;
}