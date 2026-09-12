import { useId, type InputHTMLAttributes } from "react";
export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  help?: string;
  error?: string;
}
export function Field({
  label,
  help,
  error,
  id: providedId,
  className = "",
  ...props
}: FieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const description = [
    help ? `${id}-help` : "",
    error ? `${id}-error` : "",
    props["aria-describedby"] ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="g-field">
      <label htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        className={`g-input ${className}`}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={description || undefined}
      />
      {help && (
        <p id={`${id}-help`} className="g-field-help">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="g-field-error">
          {error}
        </p>
      )}
    </div>
  );
}
