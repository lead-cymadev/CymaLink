"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import AddDeviceModal from "./AddDeviceModal";
import { Site, User } from '@mi-proyecto/types';

// Importa los íconos que vamos a usar
import { PowerIcon, UserCircleIcon, ChevronDownIcon, WifiIcon } from '@heroicons/react/24/outline';

export default function DashboardClient({ sites, user }: { sites: Site[], user: User }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleOpenModal = (siteId: number) => {
    setSelectedSiteId(siteId);
    setIsModalOpen(true);
  };
  
  const handleLogout = () => {
    localStorage.clear();
    Cookies.remove("access_token");
    window.location.href = "/auth/login";
  };
  
  const handleDeleteDevice = async (deviceId: number) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este dispositivo? Esta acción es irreversible.")) {
      return;
    }

    setIsDeleting(deviceId);
    const token = Cookies.get("access_token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_SHORT_URL}/api/raspberries/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al eliminar el dispositivo.');
      }

      router.refresh();

    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">CymaLink</span>
            </div>
            
            <div className="hidden md:flex md:items-center md:space-x-8">
              <a href="/dashboard" className="text-gray-500 hover:text-gray-900 font-medium">Inicio</a>
              <div className="relative">
                <button 
                  onClick={() => setMenuOpen(!menuOpen)} 
                  className="flex items-center text-gray-500 hover:text-gray-900 focus:outline-none"
                >
                  <UserCircleIcon className="h-6 w-6 mr-1" />
                  <span>{user.nombre}</span>
                  <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                    <button 
                      onClick={handleLogout} 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <PowerIcon className="h-5 w-5 mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-500 hover:text-gray-900">
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
              </button>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Inicio</a>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-5">
                <UserCircleIcon className="h-8 w-8 text-gray-500" />
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.nombre}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <button onClick={handleLogout} className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                  <PowerIcon className="h-6 w-6 mr-2" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Sitios Asignados
          </h1>

          {sites.length === 0 ? (
            <div className="text-center bg-white p-10 rounded-lg shadow">
              <h3 className="text-xl font-bold text-gray-700">No tienes sitios asignados</h3>
              <p className="text-gray-500 mt-2">Contacta a un administrador para que te asigne a un sitio.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sites.map((site) => (
                <div key={site.id} className="bg-white rounded-lg shadow-md transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-indigo-700 mb-2">{site.nombre}</h3>
                    <p className="text-gray-500 text-sm mb-4">{site.ubicacion}</p>
                    
                    <h4 className="font-semibold text-gray-800 mb-3 border-t pt-3">Dispositivos</h4>
                    {site.Raspberries && site.Raspberries.length > 0 ? (
                      <ul className="space-y-3">
                        {site.Raspberries.map((pi) => (
                          <li key={pi.id} className="flex justify-between items-center text-sm group">
                            <div className="flex items-center">
                              <WifiIcon className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-gray-700 font-medium">{pi.nombre}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {pi.Status && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  pi.Status.nombre === 'Online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {pi.Status.nombre}
                                </span>
                              )}
                              <button 
                                onClick={() => handleDeleteDevice(pi.id)} 
                                disabled={isDeleting === pi.id}
                                className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                                title="Eliminar dispositivo"
                              >
                                {isDeleting === pi.id ? (
                                  <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No hay dispositivos asignados.</p>
                    )}
                  </div>
                  
                  <div className="mt-auto bg-gray-50 p-4 border-t rounded-b-lg">
                    <button 
                      onClick={() => handleOpenModal(site.id)}
                      className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition"
                    >
                      + Agregar Dispositivo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {isModalOpen && selectedSiteId && (
        <AddDeviceModal 
          siteId={selectedSiteId} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  )
}