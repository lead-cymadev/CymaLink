"use client"

import { useState } from "react"

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_SHORT_URL!

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ email }) // solo mandamos email
            })

            if (res.ok) {
                alert("📧 Se enviaron las instrucciones a tu correo")
                setEmail("")
            } else {
                const errorData = await res.json().catch(() => null)
                alert(`⚠️ Error: ${errorData?.message || "No se pudo enviar el correo"}`)
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
                value='Enviar Instrucciones'
                className="bg-purple-950 hover:bg-purple-800 w-full p-3 rounded-lg text-white font-black text-xl cursor-pointer"
            />
        </form>
    )
}
