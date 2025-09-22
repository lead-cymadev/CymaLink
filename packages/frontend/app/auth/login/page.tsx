import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "CymaLink - Iniciar Sesión",
  description: "CymaLink - Iniciar sesión",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="font-black text-6xl text-blue-950">Iniciar Sesión</h1>
      <p className="text-3xl font-bold">
        Controla tus <span className="text-red-500">dispositivos IoT </span>
      </p>

      <LoginForm />

    </>
  );
}
