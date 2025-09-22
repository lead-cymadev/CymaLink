"use client"
import { useState } from "react"

export default function RegisterForm() {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Configuración de la URL base
  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_SHORT_URL!;
  
  // Validaciones
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6 // Mínimo 6 caracteres
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones del frontend
    if (!nombre || !email || !password || !confirmPassword) {
      setMessage("❌ Por favor completa todos los campos")
      return
    }

    if (!validateEmail(email)) {
      setMessage("❌ Por favor ingresa un email válido")
      return
    }

    if (!validatePassword(password)) {
      setMessage("❌ La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setMessage("❌ Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)
    setMessage("🔄 Creando cuenta...")

    try {
      console.log("Registrando usuario en:", `${API_BASE_URL}/api/auth/register`)
      
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nombre, email, password }) // 👈 ahora enviamos nombre
      })

      const data = await res.json()
      console.log("Respuesta del servidor:", data)

      if (res.ok) {
        setMessage("✅ Usuario creado correctamente")
        
        // Limpiar formulario en caso de éxito
        setNombre("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")

        // Opcional: Auto-login después del registro
        if (data.token) {
          localStorage.setItem("token", data.token)
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user))
          }
        }

      } else {
        const errorMessage = data.error || data.message || 'Error desconocido'
        setMessage(`❌ ${errorMessage}`)
      }

    } catch (error) {
      console.error("Error de conexión:", error)
      setMessage("❌ Error de conexión con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const showPasswordMismatch = confirmPassword && password !== confirmPassword

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Crear Cuenta
        </h2>

        {/* Campo Nombre */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            placeholder="Tu nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
        </div>

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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
          {email && !validateEmail(email) && (
            <p className="text-xs text-red-600">Por favor ingresa un email válido</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
          {password && !validatePassword(password) && (
            <p className="text-xs text-red-600">La contraseña debe tener al menos 6 caracteres</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmar Contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
              showPasswordMismatch ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
          {showPasswordMismatch && (
            <p className="text-xs text-red-600">Las contraseñas no coinciden</p>
          )}
          {passwordsMatch && (
            <p className="text-xs text-green-600">✓ Las contraseñas coinciden</p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isLoading || !nombre || !email || !password || !confirmPassword || !validateEmail(email) || !validatePassword(password) || password !== confirmPassword}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando cuenta...
            </span>
          ) : (
            'Registrarse'
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
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <a href={'/auth/login'} className="text-green-600 hover:text-green-800 font-medium">
              Inicia sesión aquí
            </a>
          </p>
        </div>
      </form>
    </div>
  )
}
