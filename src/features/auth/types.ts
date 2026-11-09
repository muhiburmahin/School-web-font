export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
  mustChangePassword: boolean;
}

export type SessionResult =
  | { status: "authenticated"; user: CurrentUser }
  | { status: "anonymous" }
  | { status: "forbidden" }
  | { status: "unavailable" };
