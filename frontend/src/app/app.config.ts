import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Importa tu interceptor con el nombre de archivo correcto
import { authInterceptor } from './interceptors/auth-interceptor';
// Importa tus credenciales desde el archivo de entorno
import { environment } from '../environments/environment.prod';

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. Configuración del Enrutador (una sola vez)
    provideRouter(routes), 
    
    // 2. Configuración de HttpClient (con interceptor)
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    
    // 3. Habilitar Animaciones
    provideAnimations(),
    
    // 4. Configuración de Firebase (usando las credenciales de 'environment')
    provideFirebaseApp(() => initializeApp(environment.firebase)), 
    provideAuth(() => getAuth()), 
    provideStorage(() => getStorage()),

    // 5. Habilitar los Módulos de Formularios (necesarios para ReactiveFormsModule)
    // Aunque son módulos y no funciones 'provide', en la nueva configuración 'standalone'
    // se pueden importar directamente en el array de providers.
    FormsModule,
    ReactiveFormsModule
  ]
};