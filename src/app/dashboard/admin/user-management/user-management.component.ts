import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User, Role, UserStatus } from '../../../auth/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './user-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  allUsers: User[] = [];
  readonly currentUser = this.authService.currentUser;
  readonly Role = Role;
  readonly roles = Object.values(Role);
  readonly UserStatus = UserStatus;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  get paginatedUsers(): User[] {
    const page = this.currentPage;
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.allUsers.slice(start, end);
  }

  // State for inviting users
  isInviteUserModalOpen = false;
  isSubmitting = false;
  invitationError: string | null = null;

  trackByFn(index: number, item: any): any {
    return item.email || index;
  }

  inviteUserForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: [Role.AUTHOR, Validators.required],
  });
  
  statusColorMap: Record<UserStatus, string> = {
    [UserStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [UserStatus.INVITED]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  };

  constructor() {
    this.allUsers = this.authService.getAllUsers();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onRoleChange(user: User, event: Event) {
    const newRole = (event.target as HTMLSelectElement).value as Role;
    if (user.email === this.currentUser?.email) {
       this.toastService.show("You cannot change your own role.");
       (event.target as HTMLSelectElement).value = user.role;
       return;
    }

    this.authService.updateUserRole(user.email, newRole);
    this.allUsers = this.allUsers.map(u => u.email === user.email ? {...u, role: newRole} : u);
    this.toastService.show(`Role for ${user.email} updated to ${newRole}.`);
  }

  openInviteUserModal() {
    this.inviteUserForm.reset({ email: '', role: Role.AUTHOR });
    this.invitationError = null;
    this.isInviteUserModalOpen = true;
  }

  closeInviteUserModal() {
    this.isInviteUserModalOpen = false;
  }

  onInviteUser() {
    if (this.inviteUserForm.invalid) {
      return;
    }
    this.isSubmitting = true;
    this.invitationError = null;

    const { email, role } = this.inviteUserForm.value;
    const result = this.authService.inviteUser(email!, role!);

    if (result.success) {
      this.toastService.show(`Invitation sent to ${email}.`);
      this.allUsers = this.authService.getAllUsers();
      this.closeInviteUserModal();
    } else {
      this.invitationError = result.message || 'An unexpected error occurred.';
    }

    this.isSubmitting = false;
  }
}