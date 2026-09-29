import { describe, expect, it, vi } from "vitest";
import { fundorSwal, showConfirmDialog, showToast, Swal } from "./sweetalert";

describe("sweetalert helper", () => {
  it("exports Swal and fundorSwal instances", () => {
    expect(Swal).toBeDefined();
    expect(fundorSwal).toBeDefined();
    expect(typeof fundorSwal.fire).toBe("function");
  });

  it("showConfirmDialog resolves true when confirmed", async () => {
    vi.spyOn(fundorSwal, "fire").mockResolvedValueOnce({
      isConfirmed: true,
      isDenied: false,
      isDismissed: false,
      value: true,
    });

    const confirmed = await showConfirmDialog({
      title: "Confirm action",
      text: "Are you sure?",
    });

    expect(confirmed).toBe(true);
    expect(fundorSwal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Confirm action",
        text: "Are you sure?",
        showCancelButton: true,
      }),
    );
  });

  it("showConfirmDialog resolves false when dismissed", async () => {
    vi.spyOn(fundorSwal, "fire").mockResolvedValueOnce({
      isConfirmed: false,
      isDenied: false,
      isDismissed: true,
    });

    const confirmed = await showConfirmDialog({
      title: "Cancel action",
    });

    expect(confirmed).toBe(false);
  });

  it("showToast triggers toast alert with timer", () => {
    const spy = vi.spyOn(fundorSwal, "fire").mockReturnValue({} as never);

    showToast({ title: "Success!", icon: "success" });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Success!",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      }),
    );
  });

  it("renders DOM dialog when Swal.fire is called", async () => {
    const p = Swal.fire({
      title: "Real Swal Dialog",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
    });

    const popup = document.querySelector(".swal2-popup");
    expect(popup).toBeInTheDocument();
    expect(popup).toHaveAttribute("role", "dialog");
    expect(popup).toHaveAttribute("aria-modal", "true");

    Swal.close();
    await p;
  });
});
