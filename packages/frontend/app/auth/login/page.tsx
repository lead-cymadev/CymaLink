import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";

export const metadata: Metadata = {
  title: "CymaLink - Iniciar Sesión",
  description: "CymaLink - Iniciar sesión",
};

export default function LoginPage() {
  return (
    <AuthPageLayout
      title="Inicia sesión"
      subtitle="Accede a tu panel personal para monitorear sitios y dispositivos en tiempo real."
      heroTitle="Bienvenido de vuelta"
      heroSubtitle="Continúa administrando tu red IoT con los últimos datos y alertas."
      heroHighlights={["Panel en tiempo real", "Accesos seguros", "Historial de actividad"]}
      footer={
        <div className="flex flex-col items-center gap-2 text-center text-sm text-slate-500">
          <span>
            ¿No tienes cuenta?
            <Link href="/auth/register" className="ml-1 font-semibold text-blue-700 transition hover:text-blue-900">
              Regístrate aquí
            </Link>
          </span>
          <Link href="/auth/forgot-password" className="font-medium text-blue-600 transition hover:text-blue-800">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      }
    >
      <LoginForm />
    </AuthPageLayout>
  );
}
