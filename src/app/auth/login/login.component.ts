import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly router: Router = inject(Router);
  private readonly authService: AuthService = inject(AuthService);

  isLoading$ = new BehaviorSubject<boolean>(false);
  loginError$ = new BehaviorSubject<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }
    this.isLoading$.next(true);
    this.loginError$.next(null);

    const email = this.loginForm.value.email ?? '';

    const success = await this.authService.login(email);

    if (success) {
      this.router.navigate(['/']);
    } else {
      this.loginError$.next('Invalid credentials. Please try again.');
    }
    this.isLoading$.next(false);
  }
}
