import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MembershipCenter } from "./membership-center";

describe("MembershipCenter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("redeems a code and updates the displayed credit balance", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          credits: 8,
          memberships: [
            {
              sku: "vip_monthly_alpha",
              status: "active",
              startsAt: "2026-07-17T00:00:00.000Z",
              expiresAt: "2026-08-17T00:00:00.000Z",
            },
          ],
        },
      }),
    } as Response);

    render(<MembershipCenter initialData={{ credits: 0, memberships: [] }} />);

    fireEvent.change(screen.getByLabelText("兑换码"), {
      target: { value: "ieltscope-alpha-2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "兑换并激活" }));

    await waitFor(() => {
      expect(screen.getByText("兑换成功，精批额度已更新。")).toBeInTheDocument();
    });

    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("VIP 月度精批包")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/membership/redeem",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ code: "IELTSCOPE-ALPHA-2026" }),
      }),
    );
  });

  it("shows the server validation message when a code cannot be redeemed", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        ok: false,
        error: { message: "兑换码不可用或已被使用。" },
      }),
    } as Response);

    render(<MembershipCenter initialData={{ credits: 0, memberships: [] }} />);

    fireEvent.change(screen.getByLabelText("兑换码"), {
      target: { value: "USED-CODE" },
    });
    fireEvent.click(screen.getByRole("button", { name: "兑换并激活" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("兑换码不可用或已被使用。");
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
