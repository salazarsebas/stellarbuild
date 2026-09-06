export class AuthorizationError extends Error {
  status: 401 | 403;

  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export function assertOwnsInstallation(
  installationId: number,
  installations: Array<{ id: number }>
): void {
  const owned = installations.some((installation) => installation.id === installationId);
  if (!owned) {
    throw new AuthorizationError("Installation not found for this account", 403);
  }
}
