import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuditService } from '../dashboard/admin/audit.service';
import { AuditLogAction } from '../dashboard/admin/audit.model';
import { ToastService } from '../shared/toast/toast.service';

export enum Role {
  ADMIN = 'ADMIN',
  AUTHOR = 'AUTHOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
}

export interface User {
  id: number;
  email: string;
  displayName: string;
  role: Role;
  status: UserStatus;
  inviteToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: number; // timestamp
}

interface JwtPayload {
  id: number;
  email: string;
  role: Role;
  exp: number;
}

let nextId = 5;
const MOCK_USERS: User[] = [
  { id: 1, email: 'admin@test.com', displayName: 'Admin User', role: Role.ADMIN, status: UserStatus.ACTIVE },
  { id: 2, email: 'author@test.com', displayName: 'Author User', role: Role.AUTHOR, status: UserStatus.ACTIVE },
  { id: 3, email: 'emily@test.com', displayName: 'Emily Myers', role: Role.AUTHOR, status: UserStatus.ACTIVE },
  { id: 4, email: 'michael@test.com', displayName: 'Michael Brown', role: Role.AUTHOR, status: UserStatus.INVITED, inviteToken: 'michael-invite-token-123' },
];

const JWT_TOKEN_KEY = 'jwt_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private usersSubject = new BehaviorSubject<User[]>(MOCK_USERS);
  private userSubject = new BehaviorSubject<User | null>(null);

  public users$ = this.usersSubject.asObservable();
  public currentUser$ = this.userSubject.asObservable();

  constructor(
    private readonly router: Router,
    private readonly auditService: AuditService,
    private readonly toastService: ToastService
  ) {
    this.loadUserFromToken();
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.userSubject.value;
  }

  get userRole(): Role | undefined {
    return this.userSubject.value?.role;
  }



  private loadUserFromToken(): void {
    const token = this.getToken();
    if (token) {
      try {
        const payload: JwtPayload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp > Date.now() / 1000) {
          const user = this.usersSubject.value.find(u => u.id === payload.id);
          if (user) {
            this.userSubject.next(user);
          }
        } else {
          localStorage.removeItem(JWT_TOKEN_KEY);
        }
      } catch (e) {
        console.error('Invalid token', e);
        localStorage.removeItem(JWT_TOKEN_KEY);
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem(JWT_TOKEN_KEY);
  }

  getAllUsers(): User[] {
    return this.usersSubject.value;
  }

  inviteUser(email: string, role: Role): { success: boolean; message?: string } {
    if (this.usersSubject.value.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'A user with this email already exists.' };
    }
    const inviteToken = `${email.split('@')[0]}-invite-token-${Date.now()}`;
    const newUser: User = {
      id: nextId++,
      email,
      role,
      displayName: email.split('@')[0], // Default display name
      status: UserStatus.INVITED,
      inviteToken
    };
    const currentUsers = this.usersSubject.value;
    this.usersSubject.next([...currentUsers, newUser]);
    this.auditService.addLog(AuditLogAction.USER_INVITED, `User "${email}" invited with role ${role}.`);
    // In a real app, an email would be sent. We'll log the link to the console for simulation.
    console.log(`-- SIMULATED INVITE --\nTo: ${email}\nLink: /#/register/${inviteToken}`);
    return { success: true };
  }
  
  validateInviteToken(token: string): User | undefined {
    return this.usersSubject.value.find(u => u.inviteToken === token && u.status === UserStatus.INVITED);
  }

  completeRegistration(token: string): void {
    const currentUsers = this.usersSubject.value;
    const updatedUsers = currentUsers.map(u => {
      if (u.inviteToken === token) {
        this.auditService.addLog(AuditLogAction.USER_REGISTERED, `User "${u.email}" completed registration.`);
        return { ...u, status: UserStatus.ACTIVE, inviteToken: undefined };
      }
      return u;
    });
    this.usersSubject.next(updatedUsers);
    this.router.navigate(['/login']);
    this.toastService.show('Registration successful! Please log in.');
  }
  
  requestPasswordReset(email: string): void {
    const user = this.usersSubject.value.find(u => u.email.toLowerCase() === email.toLowerCase() && u.status === UserStatus.ACTIVE);
    if (user) {
      const resetToken = `reset-token-${user.id}-${Date.now()}`;
      const resetExpires = Date.now() + 3600000; // 1 hour
      const currentUsers = this.usersSubject.value;
      const updatedUsers = currentUsers.map(u => u.id === user.id ? {...u, passwordResetToken: resetToken, passwordResetExpires: resetExpires} : u);
      this.usersSubject.next(updatedUsers);
      this.auditService.addLog(AuditLogAction.PASSWORD_RESET_REQUESTED, `Password reset requested for ${email}.`);
       // Simulate sending email
      console.log(`-- SIMULATED PASSWORD RESET --\nTo: ${email}\nLink: /#/reset-password/${resetToken}`);
    }
    // Always show a generic message for security
    this.toastService.show('If an account with that email exists, a password reset link has been sent.');
    this.router.navigate(['/login']);
  }

  validatePasswordResetToken(token: string): User | undefined {
     return this.usersSubject.value.find(u =>
      u.passwordResetToken === token &&
      u.passwordResetExpires &&
      u.passwordResetExpires > Date.now()
    );
  }

  resetPassword(token: string): void {
     const currentUsers = this.usersSubject.value;
     const updatedUsers = currentUsers.map(u => {
      if (u.passwordResetToken === token) {
        this.auditService.addLog(AuditLogAction.PASSWORD_RESET_COMPLETED, `Password for ${u.email} was reset.`);
        return { ...u, passwordResetToken: undefined, passwordResetExpires: undefined };
      }
      return u;
    });
    this.usersSubject.next(updatedUsers);
    this.router.navigate(['/login']);
    this.toastService.show('Password has been reset successfully. You can now log in.');
  }

  updateUserRole(email: string, newRole: Role): void {
    const currentUsers = this.usersSubject.value;
    const updatedUsers = currentUsers.map(user =>
      user.email === email ? { ...user, role: newRole } : user
    );
    this.usersSubject.next(updatedUsers);
    this.auditService.addLog(AuditLogAction.USER_ROLE_CHANGED, `Role of user ${email} changed to ${newRole}.`);
  }
  
  updateUserProfile(userId: number, displayName: string): void {
    const currentUsers = this.usersSubject.value;
    const updatedUsers = currentUsers.map(u =>
      u.id === userId ? { ...u, displayName } : u
    );
    this.usersSubject.next(updatedUsers);

    if (this.userSubject.value?.id === userId) {
      const currentUser = this.userSubject.value;
      if (currentUser) {
        this.userSubject.next({ ...currentUser, displayName });
      }
    }

    this.auditService.addLog(AuditLogAction.USER_PROFILE_UPDATED, `Profile updated for user ${this.userSubject.value?.email}.`);
  }

  login(email: string): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        const user = this.usersSubject.value.find(u => u.email.toLowerCase() === email.toLowerCase() && u.status === UserStatus.ACTIVE);

        if (user) {
          this.userSubject.next(user);
          const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
          const payload = btoa(JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
          }));
          const signature = 'mock-signature';
          const token = `${header}.${payload}.${signature}`;
          localStorage.setItem(JWT_TOKEN_KEY, token);

          this.auditService.addLog(AuditLogAction.USER_LOGIN, `User ${user.email} logged in.`);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  }

  logout(): void {
    const user = this.currentUser;
    if (user) {
       this.auditService.addLog(AuditLogAction.USER_LOGOUT, `User ${user.email} logged out.`);
    }
    this.userSubject.next(null);
    localStorage.removeItem(JWT_TOKEN_KEY);
    this.router.navigate(['/login']);
  }
}