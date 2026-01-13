
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AuditLogViewerComponent } from '../audit-log-viewer/audit-log-viewer.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [AuditLogViewerComponent],
  templateUrl: './admin-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPanelComponent {}
