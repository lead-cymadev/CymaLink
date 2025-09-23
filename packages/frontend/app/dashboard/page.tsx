import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt, { Secret } from 'jsonwebtoken';
import DashboardClient from "../../components/dashboard/DashboardClient"; // Tu ruta de importación
import { Site, User } from '@mi-proyecto/types';

/**
 * Función de obtención de datos que se ejecuta en el servidor.
 * @param token El token JWT del usuario para autenticar la petición.
 * @param userRole El rol del usuario para determinar qué datos obtener.
 * @returns Una promesa que resuelve a un arreglo de Sitios.
 */
async function getSitesData(token: string, userRole: string): Promise<Site[]> {
  // Determina el endpoint a usar basado en el rol del usuario
  const isAdmin = userRole === 'admin';
  const endpoint = isAdmin ? '/api/sites/all' : '/api/sites'; // Endpoint para admin vs. regular
  const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_SHORT_URL}${endpoint}`;

  console.log(`Usuario es ${userRole}. Obteniendo datos desde: ${apiUrl}`);

  try {
    const res = await fetch(apiUrl, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
      cache: 'no-store', // Asegura que los datos siempre estén frescos
    });

    if (!res.ok) {
      console.error(`Error al obtener los datos del sitio: ${res.status} ${res.statusText}`);
      redirect("/auth/login");
    }

    const data = await res.json();
    return data.data || []; // Devuelve los datos o un arreglo vacío

  } catch (error) {
    console.error("Error de red al intentar obtener los datos del sitio:", error);
    redirect("/auth/login");
  }
}

/**
 * El componente de página principal del Dashboard.
 * Se renderiza en el servidor.
 */
export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  let userPayload: User;
  try {
    const jwtSecret: Secret = process.env.JWT_SECRET || 'ESTE_SECRETO_ES_SOLO_PARA_DESARROLLO';
    // Asumimos que el payload del token contiene el rol del usuario, ej: { id: 1, email: '...', role: 'admin' }
    userPayload = jwt.verify(token, jwtSecret) as User; 
  } catch (error) {
    console.error("Token inválido, redirigiendo al login", error);
    redirect("/auth/login");
  }

  // Obtenemos los datos de los sitios, pasando el rol del usuario para la lógica condicional.
  // Asumimos que 'userPayload' tiene una propiedad 'role'. Si se llama diferente, ajústalo aquí.
  const sites = await getSitesData(token, userPayload.rol || 'user');

  // Pasamos los datos listos (sitios y usuario) al componente cliente para que los renderice.
  return <DashboardClient sites={sites} user={userPayload} />;
}