import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-content-preview-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content-preview-modal.component.html',
  styleUrls: ['./content-preview-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPreviewModalComponent {
  @Input() title!: string;
  @Input() body!: string;
  @Output() close = new EventEmitter<void>();

  get parsedContent(): string {
    return this.parseMarkdown(this.body);
  }

  private parseMarkdown(markdown: string): string {
    if (!markdown) return '';
    
    // Basic replacements, can be expanded
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`(.*)`/gim, '<code class="bg-slate-200 dark:bg-slate-700 rounded px-1 py-0.5 font-mono text-sm">$1</code>')
      .replace(/\n/g, '<br>'); // Convert newlines to breaks
  }

  onClose() {
    this.close.emit();
  }
}
