"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiService } from "@/lib/api/ApiService"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setMessage("❌ Por favor completa todos los campos")
      return
    }

    setIsLoading(true)
    setMessage("🔄 Iniciando sesión...")

    try {
      const response = await apiService.login(email, password)

      if (response.success) {
        setMessage("✅ Inicio de sesión exitoso. Redirigiendo...")

        // Fuerza recarga completa para que el dashboard tome la sesión recién creada
        window.location.href = "/dashboard"
      } else {
        setMessage(`❌ ${response.message || 'Error en el inicio de sesión'}`)
      }

    } catch (error: any) {
      console.error("Error de conexión:", error);
      setMessage(`❌ Error de conexión: ${error.message || 'No se pudo conectar al servidor'}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg ">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 p-6 bg-white rounded-lg shadow-md ">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading || !email || !password}
          className="w-full rounded-md bg-blue-900 py-2 px-4 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Iniciando sesión...
            </span>
          ) : (
            'Iniciar Sesión'
          )}
        </button>

        {message && (
          <div className={`text-sm p-3 rounded-md ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : message.includes('🔄')
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="text-center mt-4">
          <a href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
            ¿Olvidaste tu contraseña?
          </a>
            <br />
          <a href="/auth/register" className="text-sm text-blue-600 hover:text-blue-800">
            ¿No tienes cuenta? Regístrate
          </a>
        </div>
      </form>
    </div>
  )
}
