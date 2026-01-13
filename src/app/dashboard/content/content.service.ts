import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Content, ContentStatus } from './content.model';
import { AuditService } from '../admin/audit.service';
import { AuditLogAction } from '../admin/audit.model';

// Mock data
const MOCK_CONTENT: Content[] = [
  {
    id: '1',
    title: 'The Future of AI in Web Development',
    body: 'Exploring how artificial intelligence is reshaping the landscape of web development...',
    status: ContentStatus.PUBLISHED,
    authorEmail: 'admin@test.com',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'A Guide to Modern Angular',
    body: 'This article covers standalone components, signals, and the latest features in Angular.',
    status: ContentStatus.REVIEW,
    authorEmail: 'author@test.com',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Getting Started with Tailwind CSS',
    body: 'A beginner-friendly introduction to the utility-first CSS framework.',
    status: ContentStatus.DRAFT,
    authorEmail: 'emily@test.com',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Why TypeScript is Essential',
    body: 'This article was rejected because it lacked depth.',
    status: ContentStatus.REJECTED,
    authorEmail: 'author@test.com',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    rejectionReason: 'The article makes good points but lacks sufficient depth and practical examples. Please expand on the benefits of static typing with code snippets and compare it with plain JavaScript in a real-world scenario.'
  },
  {
    id: '5',
    title: 'Advanced State Management',
    body: 'This article is scheduled to be published in the future.',
    status: ContentStatus.SCHEDULED,
    authorEmail: 'admin@test.com',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    publishAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    title: 'Deploying NestJS on the Cloud',
    body: 'A step-by-step guide to deploying your NestJS applications for free. This article will cover platforms like Vercel, Railway, and Render.',
    status: ContentStatus.REVIEW,
    authorEmail: 'admin@test.com',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    title: 'Enterprise-Grade Authentication with JWT',
    body: 'Securing your application is crucial. This article explores JWT-based authentication, refresh tokens, and role-based access control in a modern web application.',
    status: ContentStatus.DRAFT,
    authorEmail: 'admin@test.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  private auditService = inject(AuditService);
  private contentSubject = new BehaviorSubject<Content[]>([]);
  private nextIdSubject = new BehaviorSubject<number>(1);
  content$ = this.contentSubject.asObservable();

  get content(): Content[] {
    return this.contentSubject.value;
  }

  loadContent(): Promise<void> {
    return new Promise(resolve => {
      // Prevent re-fetching if data is already present
      if (this.contentSubject.value.length > 0) {
        this.checkForScheduledPosts();
        resolve();
        return;
      }
      // Simulate network delay
      setTimeout(() => {
        this.contentSubject.next(MOCK_CONTENT);
        const maxId = MOCK_CONTENT.reduce((max, c) => Math.max(max, parseInt(c.id, 10)), 0);
        this.nextIdSubject.next(maxId + 1);
        this.checkForScheduledPosts();
        resolve();
      }, 1500);
    });
  }
  
  private checkForScheduledPosts() {
    const now = new Date().toISOString();
    const currentContent = this.contentSubject.value;
    const updatedContent = currentContent.map(c => {
      if (c.status === ContentStatus.SCHEDULED && c.publishAt && c.publishAt <= now) {
        this.auditService.addLog(AuditLogAction.CONTENT_STATUS_CHANGED, `Scheduled article "${c.title}" was automatically published.`);
        return { ...c, status: ContentStatus.PUBLISHED, updatedAt: now };
      }
      return c;
    });
    this.contentSubject.next(updatedContent);
  }

  getContentById(id: string): Content | undefined {
    return this.contentSubject.value.find(c => c.id === id);
  }

  createContent(title: string, body: string, authorEmail: string): Content {
    const newContent: Content = {
      id: String(this.nextIdSubject.value),
      title,
      body,
      status: ContentStatus.DRAFT,
      authorEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.nextIdSubject.next(this.nextIdSubject.value + 1);
    this.contentSubject.next([...this.contentSubject.value, newContent]);
    this.auditService.addLog(AuditLogAction.CONTENT_CREATED, `Article "${title}" created by ${authorEmail}.`);
    return newContent;
  }

  updateContent(id: string, title: string, body: string): void {
    const currentContent = this.contentSubject.value;
    const updatedContent = currentContent.map(c =>
      c.id === id ? { ...c, title, body, updatedAt: new Date().toISOString() } : c
    );
    this.contentSubject.next(updatedContent);
     this.auditService.addLog(AuditLogAction.CONTENT_UPDATED, `Article "${title}" (ID: ${id}) updated.`);
  }

  submitForReview(id: string): void {
    const content = this.getContentById(id);
    if (!content) return;
    const oldStatus = content.status;
    const updatedContent = this.contentSubject.value.map(c =>
      c.id === id ? { ...c, status: ContentStatus.REVIEW, rejectionReason: undefined, updatedAt: new Date().toISOString() } : c
    );
    this.contentSubject.next(updatedContent);
    this.auditService.addLog(AuditLogAction.CONTENT_STATUS_CHANGED, `Status of "${content.title}" changed from ${oldStatus} to REVIEW.`);
  }

  approveContent(id: string): void {
    const content = this.getContentById(id);
    if (!content) return;
    const oldStatus = content.status;
    const updatedContent = this.contentSubject.value.map(c =>
      c.id === id ? { ...c, status: ContentStatus.PUBLISHED, rejectionReason: undefined, reviewedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), publishAt: undefined } : c
    );
    this.contentSubject.next(updatedContent);
    this.auditService.addLog(AuditLogAction.CONTENT_STATUS_CHANGED, `Status of "${content.title}" changed from ${oldStatus} to PUBLISHED.`);
  }

  rejectContent(id: string, reason: string): void {
    const content = this.getContentById(id);
    if (!content) return;
    const oldStatus = content.status;
    const updatedContent = this.contentSubject.value.map(c =>
      c.id === id ? { ...c, status: ContentStatus.REJECTED, rejectionReason: reason, reviewedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : c
    );
    this.contentSubject.next(updatedContent);
    this.auditService.addLog(AuditLogAction.CONTENT_STATUS_CHANGED, `Status of "${content.title}" changed from ${oldStatus} to REJECTED.`);
  }

  scheduleContent(id: string, publishAt: string): void {
    const content = this.getContentById(id);
    if (!content) return;

    const currentContent = this.contentSubject.value;
    const updatedContent = currentContent.map(c =>
      c.id === id ? { ...c, status: ContentStatus.SCHEDULED, publishAt, updatedAt: new Date().toISOString() } : c
    );
    this.contentSubject.next(updatedContent);
    this.auditService.addLog(AuditLogAction.CONTENT_SCHEDULED, `Article "${content.title}" scheduled for ${new Date(publishAt).toLocaleString()}.`);
  }

  softDeleteContent(id: string): void {
    const contentToDelete = this.getContentById(id);
    if (contentToDelete) {
      const updatedContent = this.contentSubject.value.map(c => c.id === id ? {...c, deletedAt: new Date().toISOString()} : c);
      this.contentSubject.next(updatedContent);
      this.auditService.addLog(AuditLogAction.CONTENT_DELETED, `Article "${contentToDelete.title}" was moved to trash.`);
    }
  }

  restoreContent(id: string): void {
    const contentToRestore = this.getContentById(id);
    if (contentToRestore) {
      const updatedContent = this.contentSubject.value.map(c => c.id === id ? {...c, deletedAt: undefined} : c);
      this.contentSubject.next(updatedContent);
      this.auditService.addLog(AuditLogAction.CONTENT_RESTORED, `Article "${contentToRestore.title}" was restored from trash.`);
    }
  }

  permanentlyDeleteContent(id: string): void {
    const contentToDelete = this.getContentById(id);
    if (contentToDelete) {
      const updatedContent = this.contentSubject.value.filter(c => c.id !== id);
      this.contentSubject.next(updatedContent);
      this.auditService.addLog(AuditLogAction.CONTENT_PERMANENTLY_DELETED, `Article "${contentToDelete.title}" was permanently deleted.`);
    }
  }
}