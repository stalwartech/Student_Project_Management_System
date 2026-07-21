import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  children: ReactNode;
}

// Usage: <Button variant="primary" loading={isSaving} onClick={handleSave}>Save</Button>
export function Button({ variant = "primary", loading, children, className = "", disabled, ...rest }: ButtonProps) {
  const variantClass = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    danger: "btn-danger",
    ghost: "btn-ghost",
  }[variant];

  return (
    <button className={`${variantClass} ${className}`} disabled={disabled || loading} {...rest}>
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
