"use server"

import { RegisterSchema } from "@/src/schemas"

export async function register(formData: FormData): Promise<void> {
  const registerData = {
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    password_confirmation: formData.get("password_confirmation"),
  }

  const result = RegisterSchema.safeParse(registerData)

  if (!result.success) {
    console.error("Errores de validación:", result.error.errors.map((e) => e.message))
    return
  }

  const { resolveBackendBaseUrl } = await import('@/lib/api/apiConfig');
  const backendBase = resolveBackendBaseUrl();
  const url = `${backendBase.replace(/\/+$/, '')}/api/auth/register`;

  const req = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: result.data.name,
      password: result.data.password,
      email: result.data.email,
    }),
  })

  const json = await req.json()
  console.log("Respuesta API:", json)
}
