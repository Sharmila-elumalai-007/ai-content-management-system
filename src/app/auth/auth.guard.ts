import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router: Router = inject(Router);

  if (authService.isAuthenticated) {
    return true;
  }

  // Redirect to the login page
  return router.parseUrl('/login');
};