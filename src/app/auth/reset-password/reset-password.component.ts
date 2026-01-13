import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly authService: AuthService = inject(AuthService);

  isLoading$ = new BehaviorSubject<boolean>(false);
  isTokenValid$ = new BehaviorSubject<boolean>(false);

  resetPasswordForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordMatchValidator });

  private passwordMatchValidator(form: any) {
    return form.get('password').value === form.get('confirmPassword').value
      ? null : { 'mismatch': true };
  }

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      const user = this.authService.validatePasswordResetToken(token);
      if (user) {
        this.isTokenValid$.next(true);
      }
    }
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid) {
      return;
    }
    this.isLoading$.next(true);
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      // Simulate API call
      setTimeout(() => {
        this.authService.resetPassword(token);
        this.isLoading$.next(false);
      }, 1000);
    }
  }
}
