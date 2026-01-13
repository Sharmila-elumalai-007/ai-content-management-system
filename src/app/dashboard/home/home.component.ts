import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../content/content.service';
import { ContentStatus } from '../content/content.model';
import { AuthService, Role } from '../../auth/auth.service';
import { AuditService } from '../admin/audit.service';
import { AuditLogAction } from '../admin/audit.model';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
}

interface AuthorStat {
  authorEmail: string;
  count: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly contentService: ContentService;
  private readonly authService: AuthService;
  private readonly auditService: AuditService;

  constructor(
    contentService: ContentService,
    authService: AuthService,
    auditService: AuditService
  ) {
    this.contentService = contentService;
    this.authService = authService;
    this.auditService = auditService;
  }

  get allContent() {
    return this.contentService.content;
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  readonly Role = Role;

  get recentLogs() {
    return this.auditService.logs.slice(0, 5);
  }

  readonly actionColorMap: Record<AuditLogAction, string> = {
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

  get stats(): StatCard[] {
    const content = this.allContent;
    return [
      {
        title: 'Total Articles',
        value: content.length,
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        color: 'text-sky-500'
      },
      {
        title: 'Published',
        value: content.filter(c => c.status === ContentStatus.PUBLISHED).length,
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'text-green-500'
      },
      {
        title: 'In Review',
        value: content.filter(c => c.status === ContentStatus.REVIEW).length,
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'text-yellow-500'
      },
      {
        title: 'Drafts',
        value: content.filter(c => c.status === ContentStatus.DRAFT).length,
        icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L15.232 5.232z',
        color: 'text-slate-500'
      }
    ];
  }

  get contentByAuthor(): AuthorStat[] {
    if (this.currentUser?.role !== Role.ADMIN) {
      return [];
    }
    const content = this.allContent;
    const authorMap = new Map<string, number>();
    for (const item of content) {
      authorMap.set(item.authorEmail, (authorMap.get(item.authorEmail) || 0) + 1);
    }
    return Array.from(authorMap, ([authorEmail, count]) => ({ authorEmail, count }))
      .sort((a, b) => b.count - a.count);
  }

  trackByTitle(index: number, item: StatCard): string {
    return item.title;
  }

  trackById(index: number, item: { id: number }): number {
    return item.id;
  }

  trackByAuthorEmail(index: number, item: AuthorStat): string {
    return item.authorEmail;
  }
}
