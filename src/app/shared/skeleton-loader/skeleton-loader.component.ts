import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
      [style.width]="width"
      [style.height]="height">
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonLoaderComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
}
