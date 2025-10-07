import type { Metadata } from "next"; 

//Componente importado
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import Link from "next/link";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";

export const metadata : Metadata = {
    title: "CymaLink - Recuperar Contraseña",
    description: "Cymalink - Recuperar Contraseña"
}

export default function ForgotPasswordPage(){
    return (
        <AuthPageLayout
            title="Recupera tu acceso"
            subtitle="Te enviaremos un enlace temporal para que puedas restablecer tu contraseña."
            heroTitle="¿Necesitas ayuda?"
            heroSubtitle="Mantén tu operación activa solicitando un enlace seguro de restablecimiento."
            heroHighlights={["Token válido por 1 hora", "Verificación segura", "Soporte 24/7"]}
            footer={
                <div className="flex flex-col items-center gap-2 text-center text-sm text-slate-500">
                    <Link href={'/auth/login'} className="font-medium text-blue-600 transition hover:text-blue-800">
                        ¿Ya tienes cuenta? Inicia sesión
                    </Link>
                    <span>
                        ¿Aún no eres parte?
                        <Link href={'/auth/register'} className="ml-1 font-semibold text-blue-700 transition hover:text-blue-900">
                            Crea una cuenta
                        </Link>
                    </span>
                </div>
            }
        >
            <ForgotPasswordForm/>
        </AuthPageLayout>
    );
}
