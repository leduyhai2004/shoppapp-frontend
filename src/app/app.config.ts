import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { Provider } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
//import { TokenInterceptor } from './interceptors/token.interceptor';
import { importProvidersFrom } from '@angular/core';
import { adminRoutes } from './components/admin/admin-routes';
import { RouterModule } from '@angular/router';
import { tokenInterceptor } from './interceptors/token.interceptor';
// export const tokenInterceptorProvider = {
//   provide: HTTP_INTERCEPTORS,  // Sử dụng HTTP_INTERCEPTORS token
//   useClass: TokenInterceptor,  // Chỉ định lớp interceptor
//   multi: true,                 // Cho phép đăng ký nhiều interceptors
// };

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), 
    //importProvidersFrom(RouterModule.forRoot(routes)),
    importProvidersFrom(RouterModule.forChild(adminRoutes)),    
    provideHttpClient(
      withInterceptors([tokenInterceptor]),withFetch()
    ),
    //provideHttpClient(withFetch()),
    //provideHttpClient(),
    //tokenInterceptorProvider,
    provideClientHydration(),
    //importProvidersFrom(HttpClientModule),
  ]
};
