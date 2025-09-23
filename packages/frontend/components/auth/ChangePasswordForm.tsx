"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

// El componente recibe el token como prop
export default function ChangePasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    // Validaciones del lado del cliente
    if (!password || !confirmPassword) {
      setError("Ambos campos son obligatorios.");
      setIsSubmitting(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setIsSubmitting(false);
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setIsSubmitting(false);
      return;
    }

    try {
      // **IMPORTANTE**: Llamada a tu API para cambiar la contraseña.
      // El cuerpo debe incluir la nueva contraseña y el token.
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "El token es inválido o ha expirado.");
      }

      setMessage("¡Contraseña actualizada con éxito! Redirigiendo al login...");

      // Redirigir al usuario al login después de un cambio exitoso
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000); // Espera 3 segundos antes de redirigir

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 w-full max-w-lg space-y-8"
      noValidate
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="font-bold text-gray-700" htmlFor="password">
            Nueva Contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="Tu nueva contraseña"
            className="w-full rounded-lg border border-gray-300 p-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-gray-700" htmlFor="confirmPassword">
            Confirmar Contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Repite tu nueva contraseña"
            className="w-full rounded-lg border border-gray-300 p-3"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="w-full rounded-md border border-red-500 bg-red-100 p-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="w-full rounded-md border border-green-500 bg-green-100 p-3 text-center text-sm text-green-700">
          {message}
        </p>
      )}

      <input
        type="submit"
        value={isSubmitting ? "Cambiando..." : "Cambiar Contraseña"}
        disabled={isSubmitting || !!message} // Deshabilitar si se está enviando o si ya hay un mensaje de éxito
        className="w-full cursor-pointer rounded-md bg-blue-950 p-3 font-bold uppercase text-white hover:bg-blue-800 disabled:opacity-50"
      />
    </form>
  );
}