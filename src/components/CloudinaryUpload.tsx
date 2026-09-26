"use client";

import { useId, useRef, useState } from "react";
import { esVideo } from "@/lib/media";

const CLOUD_NAME = "dkq95jus0";
const UPLOAD_PRESET = "dioxilife";
const MAX_VIDEO_MB = 50;

export default function CloudinaryUpload({
  value,
  onChange,
  onUploadingChange,
  soloImagen = false,
}: {
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (subiendo: boolean) => void;
  soloImagen?: boolean;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const esVideoArchivo = file.type.startsWith("video/");

    if (soloImagen && esVideoArchivo) {
      alert("En esta sección solo se permiten imágenes.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (esVideoArchivo && file.size > MAX_VIDEO_MB * 1024 * 1024) {
      alert(`El video pesa demasiado. El máximo permitido es ${MAX_VIDEO_MB}MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setSubiendo(true);
    onUploadingChange?.(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (data.secure_url) {
        onChange(data.secure_url);
      } else {
        alert(
          data?.error?.message ||
            `Error al subir el ${esVideoArchivo ? "video" : "archivo"}. Intenta de nuevo.`
        );
      }
    } catch {
      alert("No se pudo subir el archivo. Revisa tu conexión e intenta de nuevo.");
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
          esVideo(value) ? (
            <video
              src={value}
              muted
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={value}
              alt="preview"
              className="w-full h-full object-cover"
            />
          )
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
          accept={soloImagen ? "image/*" : "image/*,video/*"}
          onChange={handleFile}
          className="hidden"
          id={`cloudinary-file-input-${id}`}
        />
        <label
          htmlFor={`cloudinary-file-input-${id}`}
          className={`inline-block cursor-pointer text-sm font-medium text-white rounded px-4 py-2 ${
            subiendo
              ? "bg-gray-400 pointer-events-none"
              : "bg-brand-pink hover:opacity-90"
          }`}
        >
          {subiendo
            ? "Subiendo..."
            : value
              ? soloImagen
                ? "Cambiar imagen"
                : "Cambiar archivo"
              : soloImagen
                ? "Subir imagen"
                : "Subir imagen o video"}
        </label>

        <p className="text-[11px] text-gray-400 mt-1">
          {soloImagen
            ? "JPG, PNG, WEBP u otros formatos de imagen"
            : `JPG, PNG o video (MP4, MOV) hasta ${MAX_VIDEO_MB}MB`}
        </p>
        {subiendo && (
          <p className="text-[11px] text-brand-pink font-medium mt-1">
            Subiendo, espera un momento…
          </p>
        )}
      </div>
    </div>
  );
}
