import type { Metadata } from "next";
import { obtenerUsuarioServidor } from "@/lib/auth";
import { getProductos, getCategorias } from "@/lib/inventario";
import { getConteoUnidades, getConteoAsignadas } from "@/lib/alturas";
import {
  getMovimientosReporte,
  getAsignacionesReporte,
  getUnidadesReporte,
  getProductosAlturaReporte,
} from "@/lib/reportes";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ExportarExcel from "@/components/reportes/ExportarExcel";

export const metadata: Metadata = {
  title: "Reportes — SST CONEQUIPOS",
};

export default async function ReportesPage() {
  const [
    usuario,
    productos,
    categorias,
    movimientos,
    asignaciones,
    unidades,
    equipos,
    conteoUnidades,
    conteoAsignadas,
  ] = await Promise.all([
    obtenerUsuarioServidor(),
    getProductos(),
    getCategorias(),
    getMovimientosReporte(),
    getAsignacionesReporte(),
    getUnidadesReporte(),
    getProductosAlturaReporte(),
    getConteoUnidades(),
    getConteoAsignadas(),
  ]);
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar emailUsuario={usuario?.email} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-texto">Reportes</h1>
            <p className="text-sm text-texto-secundario mt-1">
              Exporta los datos del sistema en formato Excel para análisis y
              archivo.
            </p>
          </div>

          <ExportarExcel
            productos={productos}
            categorias={categorias}
            movimientos={movimientos}
            asignaciones={asignaciones}
            unidades={unidades}
            equipos={equipos}
            conteoUnidades={conteoUnidades}
            conteoAsignadas={conteoAsignadas}
          />
        </main>
      </div>
    </div>
  );
}
