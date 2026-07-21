import { useState, type ChangeEvent } from "react";

/**
 * Generic form state hook. Give it an initial shape T, get back `values`
 * and one `update` function that patches a single field by key - covers
 * every form in the app instead of writing a bespoke setter per field.
 *
 * Usage:
 *   const { values, update, reset, setValues } = useForm({ title: "", deadline: "" });
 *   <input value={values.title} onChange={update("title")} />
 *   <select value={values.deadline} onChange={update("deadline")} />
 */
export function useForm<T extends Record<string, unknown>>(initial: T) {
  const [values, setValues] = useState<T>(initial);

  // Returns an onChange handler bound to a specific key - works for
  // <input>, <select>, and <textarea> since they all share `.value`.
  const update =
    <K extends keyof T>(key: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const target = e.target;
      const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
      setValues((prev) => ({ ...prev, [key]: value as T[K] }));
    };

  // For programmatic updates (e.g. a custom Dropzone or multi-select that
  // doesn't emit a native ChangeEvent).
  const setField = <K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => setValues(initial);

  return { values, update, setField, setValues, reset };
}
