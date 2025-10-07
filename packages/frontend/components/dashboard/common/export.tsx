// components/dashboard/common/export.tsx
"use client";
import React from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { apiService } from "@/lib/api/ApiService";

export function QuickActionsBar({
  isAdmin,
  searchQuery,
}: {
  isAdmin?: boolean;
  searchQuery?: string;
}) {
  const scope: "all" | "mine" = isAdmin ? "all" : "mine";

  const download = async (format: "csv" | "xml") => {
    try {
      if (!apiService.isAuthenticated()) {
        throw new Error("No hay una sesión activa");
      }

      const { blob, filename } = await apiService.exportSites(format, scope, searchQuery);

      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (e: any) {
      alert(e?.message || "No se pudo exportar");
      console.error("export error:", e);
    }
  };

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <article className="group flex flex-col rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-red-100 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg md:col-span-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <ArrowDownTrayIcon className="h-5 w-5" />
        </span>
        <p className="mt-4 text-sm font-semibold text-blue-900">Exportar a archivo</p>
        <p className="mt-1 text-xs text-slate-500">
          Descarga el inventario de sitios y dispositivos en CSV o XML.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => download("csv")}
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-red-300 hover:text-red-600"
          >
            Descargar CSV
          </button>
          <button
            onClick={() => download("xml")}
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-red-300 hover:text-red-600"
          >
            Descargar XML
          </button>
        </div>
      </article>
    </section>
  );
}
