import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {
  private _isDarkMode = new BehaviorSubject<boolean>(false);
  isDarkMode$ = this._isDarkMode.asObservable();

  get isDarkMode(): boolean {
    return this._isDarkMode.value;
  }

  constructor() {}

  init() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedPreference = localStorage.getItem('darkMode');

    if (storedPreference !== null) {
      this._isDarkMode.next(storedPreference === 'true');
    } else {
      this._isDarkMode.next(prefersDark);
    }
    this.updateHtmlClass(this.isDarkMode);
  }

  toggle() {
    const newValue = !this.isDarkMode;
    this._isDarkMode.next(newValue);
    localStorage.setItem('darkMode', String(newValue));
    this.updateHtmlClass(newValue);
  }

  setTheme(theme: 'light' | 'dark'): void {
    const isDark = theme === 'dark';
    if (this.isDarkMode === isDark) {
      return;
    }
    this._isDarkMode.next(isDark);
    localStorage.setItem('darkMode', String(isDark));
    this.updateHtmlClass(isDark);
  }

  private updateHtmlClass(isDark: boolean): void {
     if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}