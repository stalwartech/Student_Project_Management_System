import { useRef, useState, type DragEvent } from "react";

interface DropzoneProps {
  accept: string;
  hint: string;
  onFileSelected: (file: File) => void;
  selectedFileName?: string;
}

// Usage: <Dropzone accept=".csv" hint="CSV up to 5MB" onFileSelected={setFile} selectedFileName={file?.name} />
export function Dropzone({ accept, hint, onFileSelected, selectedFileName }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
        dragging ? "border-brand-500 bg-brand-50" : "border-gray-300 hover:border-brand-400"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />
      {selectedFileName ? (
        <p className="text-sm font-medium text-gray-900">{selectedFileName}</p>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-700">Drag & drop or click to upload</p>
          <p className="mt-1 text-xs text-gray-400">{hint}</p>
        </>
      )}
    </div>
  );
}
