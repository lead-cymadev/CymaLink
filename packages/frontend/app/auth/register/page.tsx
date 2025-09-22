import type { Metadata } from "next"; 
//Componente
import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";

export const metadata : Metadata = {
    title: "CymaLink - Crear cuenta",
    description: "CymaLink - Crear cuenta"
}

export default function RegisterPage() {

    return (
        <>
            <h1 className="font-black text-6xl text-blue-950">Registrate ahora y</h1>
            <p className="text-3xl font-bold">Controla tus <span className="text-red-500">dispotivos IOT</span></p>

            <br />
            
            <RegisterForm />

            <nav className="mt-10 flex flex-col space-y-4">
                <Link 
                    href={'/auth/forgot-password'}
                    className="text-center text-gray-500"
                >
                    ¿No recuerdas tu contraseña? Recuperala
                </Link>
            </nav>
        </>
    );
}