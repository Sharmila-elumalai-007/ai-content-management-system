import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { DarkModeService } from '../../shared/dark-mode.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly fb: FormBuilder;
  readonly authService: AuthService;
  readonly darkModeService: DarkModeService;
  private readonly toastService: ToastService;

  constructor(
    fb: FormBuilder,
    authService: AuthService,
    darkModeService: DarkModeService,
    toastService: ToastService
  ) {
    this.fb = fb;
    this.authService = authService;
    this.darkModeService = darkModeService;
    this.toastService = toastService;

    this.profileForm = this.fb.group({
      displayName: ['', Validators.required],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  profileForm: any;
  passwordForm: any;

  ngOnInit() {
    // Initial population of the form
    const user = this.currentUser;
    if (user) {
      this.profileForm.patchValue({ displayName: user.displayName });
    }
  }

  private passwordMatchValidator(form: any) {
    return form.get('newPassword').value === form.get('confirmPassword').value
      ? null : { 'mismatch': true };
  }

  onProfileSubmit() {
    if (this.profileForm.invalid) return;

    const user = this.currentUser;
    const displayName = this.profileForm.value.displayName;
    if (user && displayName) {
      this.authService.updateUserProfile(user.id, displayName);
      this.toastService.show('Profile updated successfully.');
      this.profileForm.markAsPristine();
    }
  }

  onPasswordSubmit() {
    if (this.passwordForm.invalid) return;

    // This is a mock implementation
    this.toastService.show('Password changed successfully.');
    this.passwordForm.reset();
    this.passwordForm.markAsPristine();
  }
}
