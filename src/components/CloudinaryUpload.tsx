"use client";

import { useRef, useState } from "react";

const CLOUD_NAME = "dkq95jus0";
const UPLOAD_PRESET = "dioxilife";

export default function CloudinaryUpload({
  value,
  onChange,
  onUploadingChange,
}: {
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (subiendo: boolean) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    onUploadingChange?.(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (data.secure_url) {
        onChange(data.secure_url);
      } else {
        alert(data?.error?.message || "Error al subir la imagen. Intenta de nuevo.");
      }
    } catch {
      alert("No se pudo subir la imagen. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setSubiendo(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-24 h-24 shrink-0 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
        {value ? (
          <img
            src={value}
            alt="preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[10px] text-gray-400 text-center px-1">
            Sin imagen
          </span>
        )}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
          id="cloudinary-file-input"
        />
        <label
          htmlFor="cloudinary-file-input"
          className={`inline-block cursor-pointer text-sm font-medium text-white rounded px-4 py-2 ${
            subiendo
              ? "bg-gray-400 pointer-events-none"
              : "bg-brand-pink hover:opacity-90"
          }`}
        >
          {subiendo ? "Subiendo..." : value ? "Cambiar imagen" : "Subir imagen"}
        </label>
        <p className="text-[11px] text-gray-400 mt-1">JPG o PNG</p>
        {subiendo && (
          <p className="text-[11px] text-brand-pink font-medium mt-1">
            Subiendo imagen, espera un momento…
          </p>
        )}
      </div>
    </div>
  );
}
