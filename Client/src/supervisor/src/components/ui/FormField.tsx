import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}

function FieldWrapper({ label, error, children, required }: FieldWrapperProps) {
  return (
    <div>
      {label && (
        <label className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// Usage: <TextField label="Title" value={values.title} onChange={update("title")} required />
export function TextField({ label, error, required, className = "", ...rest }: TextFieldProps) {
  return (
    <FieldWrapper label={label} error={error} required={required}>
      <input className={`input ${className}`} {...rest} />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

// Usage: <SelectField label="Status" value={values.status} onChange={update("status")} options={[{value:"open",label:"Open"}]} />
export function SelectField({ label, error, required, options, placeholder, className = "", ...rest }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} error={error} required={required}>
      <select className={`input ${className}`} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

// Usage: <TextAreaField label="Description" value={values.description} onChange={update("description")} rows={4} />
export function TextAreaField({ label, error, required, className = "", ...rest }: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label} error={error} required={required}>
      <textarea className={`input ${className}`} {...rest} />
    </FieldWrapper>
  );
}
