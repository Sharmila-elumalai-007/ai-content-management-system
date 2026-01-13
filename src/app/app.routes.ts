import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { DashboardLayoutComponent } from './dashboard/layout/layout.component';
import { HomeComponent } from './dashboard/home/home.component';
import { ContentListComponent } from './dashboard/content/content-list/content-list.component';
import { AdminPanelComponent } from './dashboard/admin/admin-panel/admin-panel.component';
import { authGuard } from './auth/auth.guard';
import { roleGuard } from './auth/role.guard';
import { Role } from './auth/auth.service';
import { ContentEditorComponent } from './dashboard/content/content-editor/content-editor.component';
import { UserManagementComponent } from './dashboard/admin/user-management/user-management.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { ProfileComponent } from './dashboard/profile/profile.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register/:token', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'profile', component: ProfileComponent },
      { 
        path: 'content',
        children: [
          { path: '', component: ContentListComponent },
          { path: 'new', component: ContentEditorComponent },
          { path: 'edit/:id', component: ContentEditorComponent },
        ] 
      },
      { 
        path: 'admin', 
        component: AdminPanelComponent,
        canActivate: [roleGuard([Role.ADMIN])]
      },
      { 
        path: 'users', 
        component: UserManagementComponent,
        canActivate: [roleGuard([Role.ADMIN])]
      },
    ],
  },
  { path: '**', redirectTo: '' } // Redirect any other path to home/login
];