"use client"

import { useState } from "react"
import { resolveBackendBaseUrl } from "@/lib/api/apiConfig"

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const backendBase = resolveBackendBaseUrl()
            const res = await fetch(`${backendBase.replace(/\/+$/, '')}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ email })
            })

            const text = await res.text()
            let data: any = {}
            if (text) {
                try {
                    data = JSON.parse(text)
                } catch (parseError) {
                    data = {}
                }
            }

            if (res.ok) {
                alert("📧 Revisa tu bandeja: enviamos instrucciones a tu correo")
                setEmail("")
            } else {
                alert(`⚠️ Error: ${data?.message || "No se pudo enviar el correo"}`)
            }
        } catch (error) {
            console.error(error)
            alert("🚨 No se pudo conectar al servidor")
        }
    }

    return (
        <form 
            onSubmit={handleSubmit}
            className="mt-14 space-y-5"
            noValidate
        >
            <div className="flex flex-col gap-2 mb-10">
                <label className="font-bold text-2xl">Email</label>
        
                <input
                    type="email"
                    placeholder="Email de Registro"
                    className="w-full border border-gray-300 p-3 rounded-lg"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
        
            <input 
                type="submit"
                value='Enviar instrucciones'
                className="w-full cursor-pointer rounded-lg bg-blue-900 p-3 text-xl font-semibold text-white transition hover:bg-blue-700"
            />
        </form>
    )
}
