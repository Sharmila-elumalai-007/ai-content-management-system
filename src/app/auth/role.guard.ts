import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Role } from './auth.service';

export const roleGuard = (allowedRoles: Role[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router: Router = inject(Router);
    const userRole = authService.userRole;

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // Redirect to a default page if the role is not authorized
    return router.parseUrl('/home');
  };
};