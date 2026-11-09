import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExternalLink, SafeLink } from "@/components/safe/safe-link";
import { SafeImage } from "@/components/safe/safe-image";

describe("safe rendering", () => {
  it("renders an external link with noopener and no unsafe scheme", () => {
    render(
      <div>
        <ExternalLink href="https://school.example/portal">Portal</ExternalLink>
        <SafeLink href="javascript:alert(1)">Bad</SafeLink>
      </div>,
    );
    const portal = screen.getByRole("link", { name: "Portal" });
    expect(portal).toHaveAttribute("href", "https://school.example/portal");
    expect(portal).toHaveAttribute("rel", "noopener noreferrer");
    expect(portal).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Bad").tagName).toBe("SPAN");
    expect(screen.queryByRole("link", { name: "Bad" })).not.toBeInTheDocument();
  });

  it("keeps a same-origin path and shows a fallback when an image fails", () => {
    render(
      <div>
        <SafeLink href="/media">Media</SafeLink>
        <SafeImage src="https://cdn.example/logo.png" alt="Logo" fallback="Image unavailable" />
      </div>,
    );
    expect(screen.getByRole("link", { name: "Media" })).toHaveAttribute("href", "/media");
    fireEvent.error(screen.getByRole("img", { name: "Logo" }));
    expect(screen.getByText("Image unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Logo" })).not.toBeInTheDocument();
  });
});
