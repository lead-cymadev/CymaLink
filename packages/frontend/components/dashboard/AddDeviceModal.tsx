"use client";

import { useState } from 'react';
// CORRECCIÓN: Se importa useRouter desde 'next/navigation' para el App Router.
import { useRouter } from 'next/navigation'; 
import Cookies from 'js-cookie';

interface AddDeviceModalProps {
  siteId: number;
  onClose: () => void;
}

export default function AddDeviceModal({ siteId, onClose }: AddDeviceModalProps) {
  const [nombre, setNombre] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Esta instancia del router es la correcta para el App Router de Next.js
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!nombre.trim() || !macAddress.trim()) {
      setError('El nombre y la MAC Address son obligatorios.');
      setIsLoading(false);
      return;
    }

    const token = Cookies.get('access_token');
    if (!token) {
      setError('Sesión no válida. Por favor, inicia sesión de nuevo.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_SHORT_URL}/api/raspberries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre,
          macAddress,
          ipAddress,
          siteId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Ocurrió un error al guardar.');
      }

      // Éxito: refresca los datos del servidor y cierra el modal
      router.refresh();
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Agregar Nuevo Dispositivo</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Dispositivo</label>
              <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label htmlFor="macAddress" className="block text-sm font-medium text-gray-700 mb-1">MAC Address</label>
              <input type="text" id="macAddress" value={macAddress} onChange={(e) => setMacAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700 mb-1">IP Address (Opcional)</label>
              <input type="text" id="ipAddress" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
          </div>
          <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-3 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center">
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Guardando...' : 'Guardar Dispositivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

