import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  isLoading$ = new BehaviorSubject<boolean>(false);

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      return;
    }
    this.isLoading$.next(true);
    const email = this.forgotPasswordForm.value.email ?? '';

    // Simulate API call
    setTimeout(() => {
      this.authService.requestPasswordReset(email);
      this.isLoading$.next(false);
    }, 1000);
  }
}
