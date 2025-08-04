import { ApplicationConfig } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
// Importa todo lo necesario de HttpClient en una línea
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideZonelessChangeDetection, provideBrowserGlobalErrorListeners } from '@angular/core';

// Importa tu interceptor
import { authInterceptor } from './interceptors/auth-interceptor';

// Asumo que tienes tus credenciales de Firebase en un archivo de entorno,
// pero por ahora lo dejo como lo tenías.
const firebaseConfig = {
  projectId: "sofilu-ecommerce",
  appId: "1:111482082352:web:641d8709858152a60149f5",
  storageBucket: "sofilu-ecommerce.firebasestorage.app",
  apiKey: "AIzaSyDCyffcCt4y_PqIkatjtshtukWJftxqJXM",
  authDomain: "sofilu-ecommerce.firebaseapp.com",
  messagingSenderId: "111482082352",
  measurementId: "G-540KE76XXS"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // Nota: zoneless es avanzado, asegúrate de que es lo que quieres.
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    provideRouter(routes),
    
    // --- ESTA ES LA LÍNEA UNIFICADA Y CORRECTA ---
    // Provee HttpClient, habilita fetch Y registra nuestro interceptor, todo en una sola llamada.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    
    // Configuración de Firebase
    provideFirebaseApp(() => initializeApp(firebaseConfig)), 
    provideAuth(() => getAuth()), 
    provideStorage(() => getStorage()),
    
    provideAnimations()
  ]
};