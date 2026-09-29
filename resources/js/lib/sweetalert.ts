import Swal from "sweetalert2";

export const fundorSwal = Swal.mixin({
  customClass: {
    popup: "fundor-swal-popup",
    confirmButton: "fundor-swal-confirm",
    cancelButton: "fundor-swal-cancel",
  },
  buttonsStyling: true,
});

export { Swal };

export interface ConfirmDialogOptions {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: "warning" | "error" | "success" | "info" | "question";
}

export async function showConfirmDialog({
  title,
  text,
  confirmButtonText = "OK",
  cancelButtonText = "Cancel",
  icon = "warning",
}: ConfirmDialogOptions): Promise<boolean> {
  const result = await fundorSwal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
  });
  return result.isConfirmed;
}

export function showToast({
  title,
  icon = "success",
}: {
  title: string;
  icon?: "warning" | "error" | "success" | "info" | "question";
}) {
  return fundorSwal.fire({
    title,
    icon,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}
