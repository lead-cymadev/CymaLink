// app/dashboard/AddDeviceModal.tsx
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface Props {
  siteId: number;
  onClose: () => void;
}

export default function AddDeviceModal({ siteId, onClose }: Props) {
  const [nombre, setNombre] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const token = Cookies.get('access_token');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_SHORT_URL}/api/raspberries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre, macAddress, ipAddress, siteId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al crear el dispositivo.');
      }

      // Si todo sale bien, refrescamos los datos del dashboard y cerramos el modal
      router.refresh(); 
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Registrar Nuevo Dispositivo</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre del Dispositivo</label>
            <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
          <div className="mb-4">
            <label htmlFor="macAddress" className="block text-sm font-medium text-gray-700">MAC Address</label>
            <input type="text" id="macAddress" value={macAddress} onChange={(e) => setMacAddress(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
          <div className="mb-4">
            <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700">IP Address (Opcional)</label>
            <input type="text" id="ipAddress" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
              {isLoading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}