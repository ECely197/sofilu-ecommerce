/**
 * =========================================================================
 * ARCHIVO DE CONFIGURACIÓN PRINCIPAL DE LA APLICACIÓN
 * =========================================================================
 * Este archivo utiliza la nueva arquitectura "standalone" de Angular para
 * configurar y proveer todas las dependencias y funcionalidades globales
 * de la aplicación sin necesidad de NgModules.
 */

import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// --- Integración con Firebase ---
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getStorage, provideStorage } from '@angular/fire/storage';

import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

// --- Componentes y Servicios de la Aplicación ---
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth-interceptor';
import { environment } from '../environments/environment';

// La constante `appConfig` exporta la configuración que se usará para arrancar la aplicación.
export const appConfig: ApplicationConfig = {
  providers: [
    // --- Detección de Cambios Zoneless (Experimental y de Alto Rendimiento) ---
    // Configura Angular para una detección de cambios más moderna y eficiente.
    provideZonelessChangeDetection(),

    // --- Configuración del Enrutador ---
    // Registra todas las rutas definidas en `app.routes.ts`.
    provideRouter(routes),

    // --- Configuración del Cliente HTTP ---
    // Habilita el `HttpClient` para toda la aplicación.
    // `withFetch()` utiliza la API Fetch del navegador.
    // `withInterceptors()` registra interceptores globales, como el que añade tokens de autenticación.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    // --- Módulo de Animaciones ---
    // Habilita el sistema de animaciones de Angular.
    provideAnimations(),

    provideCharts(withDefaultRegisterables()),

    // --- Integración con Firebase ---
    // Inicializa y provee los servicios de Firebase (App, Auth, Storage)
    // de forma inyectable en toda la aplicación.
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage()),

    // --- Módulos de Formularios (Necesarios para `standalone`) ---
    // Aunque no son `provide` functions, se pueden añadir aquí para que estén
    // disponibles globalmente si se usan en muchos componentes.
    FormsModule,
    ReactiveFormsModule,
  ],
};
