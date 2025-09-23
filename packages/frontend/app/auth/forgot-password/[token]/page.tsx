import type { Metadata } from "next";
import Link from "next/link";
// Importa el nuevo componente de formulario
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";

export const metadata: Metadata = {
  title: "CymaLink - Nueva Contraseña",
  description: "Define tu nueva contraseña para tu cuenta de CymaLink.",
};

// La página recibe 'params' que contiene el token de la URL
export default function ResetPasswordTokenPage({
  params,
}: {
  params: { token: string };
}) {
  return (
    <>
      <h1 className="font-black text-6xl text-blue-950">
        Define tu Nueva Contraseña
      </h1>
      <p className="text-3xl font-bold">
        Asegura el acceso a tus{" "}
        <span className="text-red-500">dispotivos IOT</span>
      </p>

      <br />

      {/* Pasamos el token de la URL como prop al componente del formulario.
        Este token es crucial para que el backend sepa qué usuario está
        actualizando su contraseña.
      */}
      <ChangePasswordForm token={params.token} />

      <nav className="mt-10 flex flex-col space-y-4">
        <Link
          href={"/auth/login"}
          className="text-center text-gray-500 hover:text-blue-900"
        >
          Volver a Iniciar Sesión
        </Link>
      </nav>
    </>
  );
}