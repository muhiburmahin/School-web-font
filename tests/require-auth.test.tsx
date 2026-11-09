import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequireAuth } from "@/features/auth/components/require-auth";
import type { CurrentUser } from "@/features/auth/session";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirect(url);
    throw new Error(`REDIRECT:${url}`);
  },
}));

const user: CurrentUser = {
  id: "user-1",
  email: "admin@school.test",
  displayName: "Admin",
  roles: ["SITE_ADMIN"],
  permissions: [],
  mustChangePassword: false,
};

describe("RequireAuth", () => {
  afterEach(() => {
    cleanup();
    redirect.mockClear();
  });

  it("renders children for an authenticated session and does not invent permissions", () => {
    render(
      <RequireAuth session={{ status: "authenticated", user }}>
        <p>{user.permissions.length === 0 ? "No permissions were returned." : user.permissions.join(",")}</p>
      </RequireAuth>,
    );
    expect(screen.getByText("No permissions were returned.")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("sends an anonymous session to login", () => {
    expect(() =>
      render(
        <RequireAuth session={{ status: "anonymous" }}>
          <p>Secret</p>
        </RequireAuth>,
      ),
    ).toThrow("REDIRECT:/login");
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("shows an error when the session cannot be verified", () => {
    render(
      <RequireAuth session={{ status: "unavailable" }}>
        <p>Secret</p>
      </RequireAuth>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("The session could not be verified.");
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("shows forbidden without sending the user back to login", () => {
    render(
      <RequireAuth session={{ status: "forbidden" }}>
        <p>Secret</p>
      </RequireAuth>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("You do not have access to this page.");
    expect(redirect).not.toHaveBeenCalled();
  });
});
