import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()), provideFirebaseApp(() => initializeApp({ projectId: "sofilu-ecommerce", appId: "1:111482082352:web:641d8709858152a60149f5", storageBucket: "sofilu-ecommerce.firebasestorage.app", apiKey: "AIzaSyDCyffcCt4y_PqIkatjtshtukWJftxqJXM", authDomain: "sofilu-ecommerce.firebaseapp.com", messagingSenderId: "111482082352", measurementId: "G-540KE76XXS" })), provideAuth(() => getAuth()), provideStorage(() => getStorage()),
    provideAnimations() // ¡Lo añadimos aquí!
  ]
};
