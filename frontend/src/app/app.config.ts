import { ApplicationConfig } from '@angular/core'; // ¡CAMBIO IMPORTANTE!
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideZonelessChangeDetection } from '@angular/core';

import { authInterceptor } from './interceptors/auth-interceptor';
import { environment } from '../environments/environment';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), 
    
    provideRouter(routes), 
    
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    
    provideAnimations(),
    
    provideFirebaseApp(() => initializeApp(environment.firebase)), 
    provideAuth(() => getAuth()), 
    provideStorage(() => getStorage()),

    FormsModule,
    ReactiveFormsModule
  ]
};