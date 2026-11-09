import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../messages/en.json";
import { ApiError } from "@/lib/api-error";
import { LinkForm } from "@/features/external-links/components/link-form";
import { LinkManager } from "@/features/external-links/components/link-manager";
import { externalLinkMessages } from "@/features/external-links/messages";

const fetchManagedLinks = vi.fn();
const createExternalLink = vi.fn();

vi.mock("@/features/external-links/mutations", () => ({
  fetchManagedLinks: (...args: unknown[]) => fetchManagedLinks(...args),
  createExternalLink: (...args: unknown[]) => createExternalLink(...args),
  updateExternalLink: vi.fn(),
  setExternalLinkActive: vi.fn(),
  deleteExternalLink: vi.fn(),
  reorderExternalLinks: vi.fn(),
}));

vi.mock("@/features/external-links/actions", () => ({
  revalidateExternalLinks: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const query = { limit: 20, cursor: null, category: null } as const;

function renderManager() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
    <QueryClientProvider client={client}>
      <LinkManager query={query} />
    </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

describe("external link admin", () => {
  beforeEach(() => {
    fetchManagedLinks.mockReset();
    createExternalLink.mockReset();
  });

  it("shows a fixed message when the admin list is forbidden", async () => {
    fetchManagedLinks.mockRejectedValue(new ApiError({ status: 403, kind: "forbidden", messages: ["raw backend text"] }));
    renderManager();
    expect(await screen.findByText(externalLinkMessages.forbiddenWrite)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: externalLinkMessages.create })).not.toBeInTheDocument();
    expect(screen.queryByText("raw backend text")).not.toBeInTheDocument();
  });

  it("keeps an invalid URL off the request and maps a field error", async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError({
        status: 400,
        kind: "validation",
        messages: ["url: must be an absolute https URL"],
        fieldErrors: { url: ["must be an absolute https URL"] },
      }),
    );
    render(<NextIntlClientProvider locale="en" messages={en}><LinkForm pending={false} onCancel={() => undefined} onSubmit={onSubmit} /></NextIntlClientProvider>);
    fireEvent.change(screen.getByLabelText(externalLinkMessages.labelEn), { target: { value: "Portal" } });
    fireEvent.change(screen.getByLabelText(externalLinkMessages.labelBn), { target: { value: "পোর্টাল" } });
    fireEvent.change(screen.getByLabelText(externalLinkMessages.url), { target: { value: "javascript:alert(1)" } });
    fireEvent.click(screen.getByRole("button", { name: externalLinkMessages.save }));
    expect(await screen.findByText(externalLinkMessages.urlInvalid)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(externalLinkMessages.url), { target: { value: "https://school.example/portal" } });
    fireEvent.click(screen.getByRole("button", { name: externalLinkMessages.save }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.getByText(externalLinkMessages.urlInvalid)).toBeInTheDocument();
  });
});
