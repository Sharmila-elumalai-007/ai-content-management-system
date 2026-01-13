import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContentService } from '../content.service';
import { ExportService } from '../export.service';
import { AuthService, Role } from '../../../auth/auth.service';
import { ContentStatus, Content } from '../content.model';
import { GeminiService } from '../../../../services/gemini.service';
import { FormsModule } from '@angular/forms';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader/skeleton-loader.component';
import { ConfirmationModalComponent } from '../../../shared/confirmation-modal/confirmation-modal.component';
import { ToastService } from '../../../shared/toast/toast.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

type FilterStatus = ContentStatus | 'TRASH' | '';
type SortColumn = 'title' | 'authorEmail' | 'updatedAt';

@Component({
  selector: 'app-content-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonLoaderComponent, ConfirmationModalComponent, PaginationComponent],
  templateUrl: './content-list.component.html',
  styleUrls: ['./content-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentListComponent implements OnInit {
  private readonly router: Router = inject(Router);
  private readonly contentService = inject(ContentService);
  private readonly authService = inject(AuthService);
  private readonly geminiService = inject(GeminiService);
  private readonly toastService = inject(ToastService);
  private readonly exportService = inject(ExportService);
  
  readonly Role = Role;
  readonly ContentStatus = ContentStatus;
  readonly contentStatuses = Object.values(ContentStatus);
  
  get currentUser() {
    return this.authService.currentUser;
  }
  isLoading = true;

  // Filtering, Sorting, and Pagination state
  searchTerm = '';
  statusFilter: FilterStatus = '';
  sortColumn: SortColumn = 'updatedAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  currentPage = 1;
  pageSize = 10;

  isSummaryModalOpen = false;
  summaryContent: { title: string; summary: string } | null = null;
  isSummaryLoading = false;

  // Delete Modals State
  isDeleteModalOpen = false;
  isPermanentDeleteModalOpen = false;
  contentToAction: Content | null = null;
  
  get allContent(): Content[] {
    const user = this.currentUser;
    const content = this.contentService.content;
    if (user?.role === Role.ADMIN) {
      return content;
    }
    // Authors can only see their own non-deleted content
    return content.filter(c => c.authorEmail === user?.email && !c.deletedAt);
  }

  get filteredContent(): Content[] {
    const term = this.searchTerm.toLowerCase();
    const status = this.statusFilter;
    const col = this.sortColumn;
    const dir = this.sortDirection;

    const filtered = this.allContent.filter(item => {
      // Trash view
      if (status === 'TRASH') {
        if (!item.deletedAt) return false;
      } else {
        // Regular view, hide deleted items
        if (item.deletedAt) return false;
        // Status filter for regular view
        if (status && item.status !== status) return false;
      }

      // Search term filter
      return item.title.toLowerCase().includes(term);
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      const aValue = a[col];
      const bValue = b[col];
      const direction = dir === 'asc' ? 1 : -1;

      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });
  }

  get paginatedContent(): Content[] {
    const page = this.currentPage;
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredContent.slice(start, end);
  }

  statusColorMap: Record<ContentStatus | 'SCHEDULED', string> = {
    [ContentStatus.DRAFT]: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    [ContentStatus.REVIEW]: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-300',
    [ContentStatus.PUBLISHED]: 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-300',
    [ContentStatus.REJECTED]: 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-300',
    [ContentStatus.SCHEDULED]: 'bg-sky-200 text-sky-800 dark:bg-sky-700 dark:text-sky-300',
  };



  ngOnInit() {
    this.contentService.loadContent().then(() => {
      this.isLoading = false;
      if (this.currentUser?.role === Role.ADMIN) {
        this.statusFilter = ContentStatus.REVIEW;
      }
    });
  }

  changeSort(column: SortColumn) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  createNewArticle() {
    this.router.navigate(['/content/new']);
  }

  editArticle(id: string) {
    this.router.navigate(['/content/edit', id]);
  }

  restoreArticle(content: Content) {
    this.contentService.restoreContent(content.id);
    this.toastService.show(`Article "${content.title}" restored.`);
  }

  async openSummaryModal(content: Content) {
    this.isSummaryModalOpen = true;
    this.isSummaryLoading = true;
    this.summaryContent = null;
    try {
      const summary = await this.geminiService.getSummary(content.body);
      this.summaryContent = { title: content.title, summary };
    } catch (error) {
      this.summaryContent = { title: content.title, summary: 'Could not generate summary.' };
    } finally {
      this.isSummaryLoading = false;
    }
  }

  closeSummaryModal() {
    this.isSummaryModalOpen = false;
  }

  openDeleteModal(content: Content) {
    this.contentToAction = content;
    this.isDeleteModalOpen = true;
  }

  onDeleteConfirmed(shouldDelete: boolean) {
    this.isDeleteModalOpen = false;
    if (shouldDelete) {
      const content = this.contentToAction;
      if (content) {
        this.contentService.softDeleteContent(content.id);
        this.toastService.show(`Article "${content.title}" moved to trash.`);
      }
    }
    this.contentToAction = null;
  }

  openPermanentDeleteModal(content: Content) {
    this.contentToAction = content;
    this.isPermanentDeleteModalOpen = true;
  }

  onPermanentDeleteConfirmed(shouldDelete: boolean) {
    this.isPermanentDeleteModalOpen = false;
    if (shouldDelete) {
      const content = this.contentToAction;
      if (content) {
        this.contentService.permanentlyDeleteContent(content.id);
        this.toastService.show(`Article "${content.title}" permanently deleted.`);
      }
    }
    this.contentToAction = null;
  }
}