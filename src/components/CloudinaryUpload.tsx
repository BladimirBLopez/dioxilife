"use client";

import { useState } from "react";

const CLOUD_NAME = "dkq95jus0";
const UPLOAD_PRESET = "dioxilife";

export default function CloudinaryUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendo(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    setSubiendo(false);

    if (data.secure_url) {
      onChange(data.secure_url);
    } else {
      alert("Error al subir la imagen");
    }
  }

  return (
    <div>
      {value && (
        <img
          src={value}
          alt="preview"
          className="w-24 h-24 object-cover rounded mb-2 border"
        />
      )}
      <input type="file" accept="image/*" onChange={handleFile} />
      {subiendo && <p className="text-xs text-gray-500 mt-1">Subiendo...</p>}
    </div>
  );
}
