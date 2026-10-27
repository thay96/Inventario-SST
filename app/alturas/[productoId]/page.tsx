import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioServidor } from "@/lib/auth";
import { getProductoAlturaPorId, getUnidadesPorProducto } from "@/lib/alturas";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import TablaUnidades from "@/components/alturas/TablaUnidades";
import Boton from "@/components/ui/Boton";

export const metadata: Metadata = {
  title: "Unidades — SST CONEQUIPOS",
};

interface PageProps {
  params: Promise<{ productoId: string }>;
}

export default async function UnidadesAlturaPage({ params }: PageProps) {
  const { productoId } = await params;
  const usuario = await obtenerUsuarioServidor();

  const producto = await getProductoAlturaPorId(productoId);
  if (!producto) notFound();

  const unidades = await getUnidadesPorProducto(productoId);
  const esAdmin = usuario?.email?.endsWith("@conequipos.com") ?? false;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar emailUsuario={usuario?.email} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <Link
              href="/alturas"
              className="text-sm font-semibold text-texto hover:underline"
            >
              ← Volver a Equipos de Altura
            </Link>
            <div className="flex items-center justify-between mt-3">
              <div>
                <h1 className="text-xl font-semibold text-texto">
                  {producto.nombre}
                </h1>
                <p className="text-sm text-texto-secundario mt-1">
                  {unidades.length} unidad{unidades.length !== 1 ? "es" : ""}{" "}
                  registrada{unidades.length !== 1 ? "s" : ""}
                  {producto.codigo ? ` · Código: ${producto.codigo}` : ""}
                </p>
              </div>
              {esAdmin && (
                <Link href={`/alturas/${productoId}/nueva`}>
                  <Boton variante="primario" tamanio="sm">
                    Agregar unidad
                  </Boton>
                </Link>
              )}
            </div>
          </div>

          <TablaUnidades unidades={unidades} productoId={productoId} />
        </main>
      </div>
    </div>
  );
}
