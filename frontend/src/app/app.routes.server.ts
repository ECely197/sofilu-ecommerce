import { Routes, Route } from '@angular/router'; // Importamos Route
import { routes } from './app.routes';
import { RenderMode, ServerRoute } from '@angular/ssr';

// Función auxiliar para buscar y marcar rutas dinámicas
const markDynamicRoutes = (routes: Routes): void => {
  for (const route of routes) {
    // Si la ruta es dinámica (contiene ':')
    if (route.path && route.path.includes(':')) {
      // Le añadimos la data para que el servidor la renderice en el cliente
      (route as Route).data = { ...route.data, renderMode: 'client' };
    }
    // Hacemos lo mismo recursivamente para las rutas hijas
    if (route.children) {
      markDynamicRoutes(route.children);
    }
  }
};

// Ejecutamos nuestra función sobre el array de rutas importado
markDynamicRoutes(routes);

// Exportamos el array de rutas ya modificado, pero le decimos a TypeScript
// que "confíe en nosotros" y lo trate como si fuera del tipo ServerRoute[].
export const serverRoutes: ServerRoute[] = routes as ServerRoute[];