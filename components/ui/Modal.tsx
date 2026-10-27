"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  ancho?: "normal" | "grande" | "extra-grande";
}

export default function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  ancho = "normal",
}: ModalProps) {
  useEffect(() => {
    if (!abierto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const claseAncho =
    ancho === "extra-grande"
      ? "max-w-4xl"
      : ancho === "grande"
        ? "max-w-2xl"
        : "max-w-md";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`bg-white rounded shadow-lg w-full ${claseAncho} max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between border-b border-borde px-5 py-3">
          <h2 className="text-base font-semibold text-texto">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-texto-secundario hover:text-texto text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
