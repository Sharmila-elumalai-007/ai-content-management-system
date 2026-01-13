import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { AuditService } from '../audit.service';
import { AuditLogAction } from '../audit.model';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader/skeleton-loader.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-audit-log-viewer',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent, PaginationComponent],
  templateUrl: './audit-log-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogViewerComponent implements OnInit {
  private readonly auditService = inject(AuditService);
  isLoading$ = new BehaviorSubject<boolean>(true);

  // Pagination
  currentPage$ = new BehaviorSubject<number>(1);
  pageSize = 15;

  get paginatedLogs(): any[] {
    const page = this.currentPage$.value;
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.auditService.logs.slice(start, end);
  }

  get totalLogs(): number {
    return this.auditService.logs.length;
  }

  ngOnInit() {
    this.auditService.loadLogs().then(() => {
      this.isLoading$.next(false);
    });
  }

  onPageChange(page: number): void {
    this.currentPage$.next(page);
  }

  formatAction(action: string): string {
    return action.replace(/_/g, ' ');
  }

  actionColorMap: Record<AuditLogAction, string> = {
    [AuditLogAction.USER_LOGIN]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [AuditLogAction.USER_LOGOUT]: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    [AuditLogAction.CONTENT_CREATED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [AuditLogAction.CONTENT_UPDATED]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [AuditLogAction.CONTENT_STATUS_CHANGED]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    [AuditLogAction.USER_ROLE_CHANGED]: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    [AuditLogAction.USER_CREATED]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
    [AuditLogAction.USER_INVITED]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
    [AuditLogAction.USER_REGISTERED]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    [AuditLogAction.PASSWORD_RESET_REQUESTED]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    [AuditLogAction.PASSWORD_RESET_COMPLETED]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    [AuditLogAction.CONTENT_DELETED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    [AuditLogAction.USER_PROFILE_UPDATED]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    // Fix: Add color mappings for new audit log actions.
    [AuditLogAction.CONTENT_SCHEDULED]: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',
    [AuditLogAction.CONTENT_RESTORED]: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    [AuditLogAction.CONTENT_PERMANENTLY_DELETED]: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
  };
}