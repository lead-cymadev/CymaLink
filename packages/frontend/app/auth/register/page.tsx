import type { Metadata } from "next"; 
//Componente
import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";

export const metadata : Metadata = {
    title: "CymaLink - Crear cuenta",
    description: "CymaLink - Crear cuenta"
}

export default function RegisterPage() {
  return (
    <AuthPageLayout
      title="Crea tu cuenta"
      subtitle="Habilita la visibilidad total sobre tus sitios y dispositivos conectados."
      heroTitle="Escala tu red"
      heroSubtitle="Configura nuevos sitios, agrega dispositivos y comparte acceso con tu equipo."
      heroHighlights={["Onboarding guiado", "Roles y permisos", "Sincronización instantánea"]}
      footer={
        <div className="flex flex-col items-center gap-2 text-center text-sm text-slate-500">
          <span>
            ¿Ya tienes cuenta?
            <Link href="/auth/login" className="ml-1 font-semibold text-blue-700 transition hover:text-blue-900">
              Inicia sesión aquí
            </Link>
          </span>
          <Link href="/auth/forgot-password" className="font-medium text-blue-600 transition hover:text-blue-800">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      }
    >
      <RegisterForm />
    </AuthPageLayout>
  );
}
