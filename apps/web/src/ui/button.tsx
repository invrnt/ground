import type { ButtonHTMLAttributes } from "react";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}
export function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`g-button g-button--${variant} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? <span aria-hidden="true" className="g-spinner" /> : null}
      {children}
    </button>
  );
}
