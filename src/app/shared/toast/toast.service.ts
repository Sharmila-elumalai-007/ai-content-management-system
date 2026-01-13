
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  message: string;
  id: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts$ = new BehaviorSubject<Toast[]>([]);
  private nextId = 0;

  show(message: string) {
    const newToast: Toast = { message, id: this.nextId++ };
    const currentToasts = this.toasts$.value;
    this.toasts$.next([...currentToasts, newToast]);

    setTimeout(() => this.remove(newToast.id), 3000);
  }

  remove(id: number) {
    const currentToasts = this.toasts$.value;
    this.toasts$.next(currentToasts.filter(toast => toast.id !== id));
  }
}
