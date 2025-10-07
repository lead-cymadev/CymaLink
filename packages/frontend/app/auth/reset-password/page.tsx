import type { Metadata } from "next";
import Link from "next/link";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";

export const metadata: Metadata = {
  title: "CymaLink - Restablecer Contraseña",
  description: "Ingresa una nueva contraseña para tu cuenta CymaLink.",
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams?.token ?? "";

  return (
    <AuthPageLayout
      title="Define una nueva contraseña"
      subtitle="Introduce una clave segura para recuperar el acceso a CymaLink."
      heroTitle="Último paso"
      heroSubtitle="Tu enlace es único y caduca en 60 minutos para mantener la seguridad."
      heroHighlights={["Token encriptado", "Validación inmediata", "Confirma y accede"]}
      footer={
        <div className="flex flex-col items-center gap-2 text-center text-sm text-slate-500">
          <Link href="/auth/login" className="font-medium text-blue-600 transition hover:text-blue-800">
            Volver al inicio de sesión
          </Link>
        </div>
      }
    >
      {token ? (
        <ChangePasswordForm token={token} />
      ) : (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-800">
          <h2 className="text-lg font-semibold">Token no encontrado</h2>
          <p className="mt-2 text-sm">
            El enlace que abriste no incluye un token válido. Solicita un nuevo correo de restablecimiento desde la página de
            <Link href="/auth/forgot-password" className="font-semibold text-amber-900 underline">
              {' '}¿Olvidaste tu contraseña?
            </Link>
            .
          </p>
        </div>
      )}
    </AuthPageLayout>
  );
}
