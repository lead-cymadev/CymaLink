import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt, { Secret } from 'jsonwebtoken';
import DashboardClient from "../../components/dashboard/DashboardClient"; // Tu ruta de importación
import { Site, User } from '@mi-proyecto/types';

/**
 * Función de obtención de datos que se ejecuta en el servidor.
 * @param token El token JWT del usuario para autenticar la petición.
 * @returns Una promesa que resuelve a un arreglo de Sitios.
 */
async function getSitesData(token: string): Promise<Site[]> {
  const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_SHORT_URL}/api/sites`;

  try {
    const res = await fetch(apiUrl, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
      cache: 'no-store', // Asegura que los datos siempre estén frescos
    });

    if (!res.ok) {
      // Si la respuesta no es exitosa (ej. 401 Unauthorized, 404 Not Found), redirigir
      console.error(`Error al obtener los datos del sitio: ${res.status} ${res.statusText}`);
      redirect("/auth/login");
    }

    const data = await res.json();
    return data.data || []; // Devuelve los datos o un arreglo vacío si no hay nada

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

  // Si no hay token en las cookies, el usuario no está autenticado.
  if (!token) {
    redirect("/auth/login");
  }

  let userPayload: User;
  try {
    // Verificamos y decodificamos el token para obtener los datos del usuario.
    const jwtSecret: Secret = process.env.JWT_SECRET || 'ESTE_SECRETO_ES_SOLO_PARA_DESARROLLO';
    userPayload = jwt.verify(token, jwtSecret) as User;
  } catch (error) {
    console.error("Token inválido, redirigiendo al login", error);
    // Si el token es inválido (expirado, malformado), redirigir.
    redirect("/auth/login");
  }

  // Obtenemos los datos de los sitios, ya autenticados.
  const sites = await getSitesData(token);

  // Pasamos los datos listos (sitios y usuario) al componente cliente para que los renderice.
  return <DashboardClient sites={sites} user={userPayload} />;
}