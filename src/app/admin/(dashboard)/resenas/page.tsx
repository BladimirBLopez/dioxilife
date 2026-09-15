"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

type Resena = {
  id: string;
  nombreCliente: string;
  calificacion: number;
  comentario: string;
  productoId: string | null;
  producto: { nombre: string } | null;
  aprobado: boolean;
  createdAt: string;
};

type Filtro = "pendientes" | "aprobadas" | "todas";

export default function ResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("pendientes");
  const [borrarId, setBorrarId] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    const res = await fetch("/api/admin/resenas");
    if (res.ok) {
      setResenas(await res.json());
    }
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function cambiarAprobado(id: string, aprobado: boolean) {
    setProcesandoId(id);
    const res = await fetch(`/api/admin/resenas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aprobado }),
    });
    if (res.ok) {
      setResenas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, aprobado } : r))
      );
    } else {
      alert("No se pudo actualizar la reseña");
    }
    setProcesandoId(null);
  }

  async function confirmarBorrar() {
    if (!borrarId) return;
    const res = await fetch(`/api/admin/resenas/${borrarId}`, {
      method: "DELETE",
    });
    setBorrarId(null);
    if (res.ok) {
      setResenas((prev) => prev.filter((r) => r.id !== borrarId));
    } else {
      alert("No se pudo borrar la reseña");
    }
  }

  const pendientesCount = resenas.filter((r) => !r.aprobado).length;
  const aprobadasCount = resenas.filter((r) => r.aprobado).length;

  const visibles = resenas.filter((r) => {
    if (filtro === "pendientes") return !r.aprobado;
    if (filtro === "aprobadas") return r.aprobado;
    return true;
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-[#1F1B24] mb-5">Reseñas</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFiltro("pendientes")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
            filtro === "pendientes"
              ? "bg-brand-pink text-white border-brand-pink"
              : "bg-white text-[#6B6870] border-gray-300"
          }`}
        >
          Pendientes ({pendientesCount})
        </button>
        <button
          onClick={() => setFiltro("aprobadas")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
            filtro === "aprobadas"
              ? "bg-brand-pink text-white border-brand-pink"
              : "bg-white text-[#6B6870] border-gray-300"
          }`}
        >
          Aprobadas ({aprobadasCount})
        </button>
        <button
          onClick={() => setFiltro("todas")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
            filtro === "todas"
              ? "bg-brand-pink text-white border-brand-pink"
              : "bg-white text-[#6B6870] border-gray-300"
          }`}
        >
          Todas ({resenas.length})
        </button>
      </div>

      {cargando ? (
        <p className="text-sm text-[#8A8790]">Cargando...</p>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-[#8A8790]">No hay reseñas en esta vista.</p>
      ) : (
        <div className="space-y-3">
          {visibles.map((r) => (
            <div key={r.id} className="admin-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-[#1F1B24]">
                      {r.nombreCliente}
                    </p>
                    <span className="text-xs text-yellow-500">
                      {"⭐".repeat(r.calificacion)}
                    </span>
                    {!r.aprobado && (
                      <span className="text-[10px] font-bold text-white bg-orange-500 px-1.5 py-0.5 rounded-full">
                        PENDIENTE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-pink font-medium mt-0.5">
                    {r.producto ? r.producto.nombre : "Reseña general de la tienda"}
                  </p>
                  <p className="text-sm text-[#6B6870] mt-1 whitespace-pre-line">
                    {r.comentario}
                  </p>
                  <p className="text-[11px] text-[#8A8790] mt-1">
                    {new Date(r.createdAt).toLocaleDateString("es-BO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 text-sm mt-3">
                {r.aprobado ? (
                  <button
                    onClick={() => cambiarAprobado(r.id, false)}
                    disabled={procesandoId === r.id}
                    className="text-[#6B6870] font-medium hover:underline"
                  >
                    Ocultar
                  </button>
                ) : (
                  <button
                    onClick={() => cambiarAprobado(r.id, true)}
                    disabled={procesandoId === r.id}
                    className="text-green-600 font-medium hover:underline"
                  >
                    Aprobar
                  </button>
                )}
                <button
                  onClick={() => setBorrarId(r.id)}
                  className="text-red-600 font-medium hover:underline"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {borrarId && (
        <ConfirmDialog
          title="Borrar reseña"
          message="¿Seguro que quieres borrar esta reseña? Esta acción no se puede deshacer."
          onConfirm={confirmarBorrar}
          onCancel={() => setBorrarId(null)}
        />
      )}
    </div>
  );
}
