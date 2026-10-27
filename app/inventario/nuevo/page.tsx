import type { Metadata } from "next";
import Link from "next/link";
import { obtenerUsuarioServidor } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import FormularioProducto from "@/components/inventario/FormularioProducto";
import { getCategorias } from "@/lib/inventario";

export const metadata: Metadata = {
  title: "Nuevo producto — SST CONEQUIPOS",
};

export default async function NuevoProductoPage() {
  const usuario = await obtenerUsuarioServidor();
  const categorias = await getCategorias();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar emailUsuario={usuario?.email} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <Link
              href="/inventario"
              className="text-sm font-semibold text-texto hover:underline"
            >
              ← Volver a inventario
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-texto mb-6">Nuevo producto</h1>

          <FormularioProducto categorias={categorias} />
        </main>
      </div>
    </div>
  );
}
