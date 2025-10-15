// En: frontend/src/app/utils/script-loader.ts

/**
 * Carga un script externo de forma dinámica y devuelve una Promesa
 * que se resuelve cuando el script ha terminado de cargarse.
 * @param url La URL del script a cargar.
 * @returns Una Promesa que se resuelve a `true` si se carga, o se rechaza si falla.
 */
export function loadScript(url: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Si el script ya existe en la página, no lo cargamos de nuevo.
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';

    script.onload = () => resolve(true);
    script.onerror = () =>
      reject(new Error(`No se pudo cargar el script: ${url}`));

    document.head.appendChild(script);
  });
}
