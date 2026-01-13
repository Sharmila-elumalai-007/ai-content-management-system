import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, User } from '../auth.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly authService: AuthService = inject(AuthService);

  isLoading$ = new BehaviorSubject<boolean>(false);
  isTokenValid$ = new BehaviorSubject<boolean>(false);
  user$ = new BehaviorSubject<User | null>(null);

  registerForm = this.fb.group({
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
      const user = this.authService.validateInviteToken(token);
      if (user) {
        this.isTokenValid$.next(true);
        this.user$.next(user);
      }
    }
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }
    this.isLoading$.next(true);
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      // Simulate API call
      setTimeout(() => {
        this.authService.completeRegistration(token);
        this.isLoading$.next(false);
      }, 1000);
    }
  }
}
