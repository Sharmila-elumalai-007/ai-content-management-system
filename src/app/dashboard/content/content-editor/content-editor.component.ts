import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Content, ContentStatus } from '../content.model';
import { ContentService } from '../content.service';
import { AuthService, Role } from '../../../auth/auth.service';
import { GeminiService, SeoSuggestions } from '../../../../services/gemini.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { ContentPreviewModalComponent } from '../content-preview-modal/content-preview-modal.component';

type SuggestionType = 'title' | 'grammar' | 'seo';
type SuggestionResult = string | string[] | SeoSuggestions | null;

@Component({
  selector: 'app-content-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ContentPreviewModalComponent],
  templateUrl: './content-editor.component.html',
  styleUrls: ['./content-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentEditorComponent implements OnInit {
  private readonly fb: FormBuilder;
  private readonly router: Router;
  private readonly route: ActivatedRoute;
  private readonly contentService: ContentService;
  private readonly authService: AuthService;
  private readonly geminiService: GeminiService;
  private readonly toastService: ToastService;

  constructor(
    fb: FormBuilder,
    router: Router,
    route: ActivatedRoute,
    contentService: ContentService,
    authService: AuthService,
    geminiService: GeminiService,
    toastService: ToastService
  ) {
    this.fb = fb;
    this.router = router;
    this.route = route;
    this.contentService = contentService;
    this.authService = authService;
    this.geminiService = geminiService;
    this.toastService = toastService;

    this.editorForm = this.fb.group({
      title: ['', Validators.required],
      body: ['', Validators.required],
    });
  }

  contentItem: Content | null = null;
  isNew = true;
  isPreviewModalOpen = false;
  isAiModalOpen = false;

  // Rejection modal state
  isRejectionModalOpen = false;
  rejectionReason = '';

  // AI Assistant state
  isAiLoading = false;
  aiError: string | null = null;
  aiSuggestions: SuggestionResult = null;
  activeSuggestionType: SuggestionType | null = null;

  get currentUser() {
    return this.authService.currentUser;
  }
  readonly Role = Role;
  readonly ContentStatus = ContentStatus;

  editorForm: any;

  ngOnInit() {
    const contentId = this.route.snapshot.paramMap.get('id');
    if (contentId) {
      this.isNew = false;
      const content = this.contentService.getContentById(contentId);
      if (content) {
        this.contentItem = content;
        this.editorForm.patchValue(content);
      } else {
        this.router.navigate(['/content']); // Not found
      }
    }
  }

  saveDraft() {
    if (this.editorForm.invalid) return;

    const { title, body } = this.editorForm.value;
    const currentContent = this.contentItem;

    if (this.isNew) {
      const user = this.currentUser;
      if (user) {
        const newContent = this.contentService.createContent(title!, body!, user.email);
        this.toastService.show('Draft created successfully!');
        this.router.navigate(['/content/edit', newContent.id]);
      }
    } else if (currentContent) {
      this.contentService.updateContent(currentContent.id, title!, body!);
      this.contentItem = { ...currentContent, title: title!, body: body! };
      this.toastService.show('Draft saved successfully!');
    }
  }
  
  openPreviewModal() {
    this.isPreviewModalOpen = true;
  }

  closePreviewModal() {
    this.isPreviewModalOpen = false;
  }

  submitForReview() {
    this.saveDraft();
    const currentContent = this.contentItem;
    if (currentContent && (currentContent.status === ContentStatus.DRAFT || currentContent.status === ContentStatus.REJECTED)) {
      this.contentService.submitForReview(currentContent.id);
      this.toastService.show('Content submitted for review!');
      setTimeout(() => this.router.navigate(['/content']), 100);
    }
  }

  approveContent() {
    const currentContent = this.contentItem;
    if (currentContent && this.currentUser?.role === Role.ADMIN) {
      this.contentService.approveContent(currentContent.id);
      this.toastService.show('Content has been published!');
      setTimeout(() => this.router.navigate(['/content']), 100);
    }
  }
  
  rejectContent() {
    this.rejectionReason = ''; // Reset before opening
    this.isRejectionModalOpen = true;
  }

  closeRejectionModal() {
    this.isRejectionModalOpen = false;
  }

  confirmRejection() {
    if (!this.rejectionReason.trim()) return;

    const currentContent = this.contentItem;
    if (currentContent && this.currentUser?.role === Role.ADMIN) {
      this.contentService.rejectContent(currentContent.id, this.rejectionReason);
      this.toastService.show('Content has been rejected.');
      this.closeRejectionModal();
      setTimeout(() => this.router.navigate(['/content']), 100);
    }
  }

  // AI Assistant Methods
  async getAiSuggestions(type: SuggestionType) {
    const content = this.editorForm.value.body;
    if (!content?.trim()) return;

    this.activeSuggestionType = type;
    this.isAiLoading = true;
    this.aiError = null;
    this.aiSuggestions = null;

    try {
      let result: SuggestionResult;
      switch (type) {
        case 'title':
          result = await this.geminiService.getTitleSuggestions(content);
          break;
        case 'grammar':
          result = await this.geminiService.getGrammarSuggestion(content);
          break;
        case 'seo':
           result = await this.geminiService.getSeoSuggestions(content);
          break;
      }
      this.aiSuggestions = result;
    } catch (e) {
      this.aiError = 'An error occurred while fetching suggestions.';
      console.error(e);
    } finally {
      this.isAiLoading = false;
    }
  }
  
  openAiModal() {
    this.aiSuggestions = null;
    this.activeSuggestionType = null;
    this.aiError = null;
    this.isAiModalOpen = true;
  }

  closeAiModal() {
    this.isAiModalOpen = false;
  }

  applyTitleSuggestion(title: string) {
    this.editorForm.get('title')?.setValue(title);
    this.closeAiModal();
  }

  applyBodySuggestion(newBody: string) {
    this.editorForm.get('body')?.setValue(newBody);
    this.closeAiModal();
  }
  
  // Type guards for template
  isString(value: unknown): value is string { return typeof value === 'string'; }
  isStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every(item => typeof item === 'string'); }
  isSeoSuggestions(value: unknown): value is SeoSuggestions { return value !== null && typeof value === 'object' && 'keywords' in value; }
}