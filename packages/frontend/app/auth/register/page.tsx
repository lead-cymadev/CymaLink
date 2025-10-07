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
    >
      <RegisterForm />
    </AuthPageLayout>
  );
}
