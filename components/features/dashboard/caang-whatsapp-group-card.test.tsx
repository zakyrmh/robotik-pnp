import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CaangWhatsappGroupCard } from "./caang-whatsapp-group-card";

describe("CaangWhatsappGroupCard", () => {
  it("renders a safe WhatsApp group link when one is configured", () => {
    render(
      <CaangWhatsappGroupCard url="https://chat.whatsapp.com/example-group" />,
    );

    const link = screen.getByRole("link", {
      name: /bergabung ke grup whatsapp/i,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://chat.whatsapp.com/example-group",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("does not render a card when no group link is configured", () => {
    const { container } = render(<CaangWhatsappGroupCard url={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
