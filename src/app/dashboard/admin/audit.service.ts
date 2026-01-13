import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuditLog, AuditLogAction } from './audit.model';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private nextId = 1;
  private logsSubject = new BehaviorSubject<AuditLog[]>([]);

  public logs$ = this.logsSubject.asObservable();

  get logs(): AuditLog[] {
    return this.logsSubject.value;
  }

  loadLogs(): Promise<void> {
    return new Promise(resolve => {
      if (this.logsSubject.value.length > 0) {
        resolve();
        return;
      }

      setTimeout(() => {
        const MOCK_LOGS: AuditLog[] = [
          { id: 1, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), action: AuditLogAction.USER_LOGIN, details: 'User admin@test.com logged in.'},
          { id: 2, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), action: AuditLogAction.CONTENT_STATUS_CHANGED, details: 'Status of "A Guide to Modern Angular" changed from DRAFT to REVIEW.'},
        ];
        this.logsSubject.next(MOCK_LOGS);
        this.nextId = MOCK_LOGS.reduce((max, log) => Math.max(max, log.id), 0) + 1;
        resolve();
      }, 1200);
    });
  }

  addLog(action: AuditLogAction, details: string) {
    const newLog: AuditLog = {
      id: this.nextId++,
      timestamp: new Date().toISOString(),
      action,
      details,
    };
    // Add to the top of the list
    this.logsSubject.next([newLog, ...this.logsSubject.value]);
  }
}