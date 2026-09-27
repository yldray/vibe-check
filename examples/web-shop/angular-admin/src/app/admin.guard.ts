import { CanActivateFn } from '@angular/router';
// Only the admin UI checks the role; the API does not.
export const adminGuard: CanActivateFn = () => localStorage.getItem('role') === 'admin';
