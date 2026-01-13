import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, Role } from '../../auth/auth.service';
import { ToastComponent } from '../../shared/toast/toast.component';
import { DarkModeService } from '../../shared/dark-mode.service';

interface Notification {
  icon: string;
  message: string;
  time: string;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayoutComponent {
  constructor(
    public authService: AuthService,
    public darkModeService: DarkModeService
  ) {}

  isSidebarOpen = true;
  isUserMenuOpen = false;
  isNotificationsOpen = false;

  Role = Role; // Expose Role enum to the template

  // Mock notifications
  notifications: Notification[] = [
    { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', message: 'Article "Modern Angular" was approved.', time: '15m ago'},
    { icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', message: 'Article "TypeScript" was rejected.', time: '1h ago'},
    { icon: 'M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M12 12l-6.75 4.5M12 12l6.75 4.5', message: 'New article submitted for review.', time: '3h ago'},
  ];

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.isNotificationsOpen = false;
    }
  }

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
     if (this.isNotificationsOpen) {
      this.isUserMenuOpen = false;
    }
  }

  logout() {
    this.authService.logout();
  }

  trackByMessage(index: number, item: Notification): string {
    return item.message;
  }
}
