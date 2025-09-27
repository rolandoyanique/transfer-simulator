import { Component } from '@angular/core';
import { AccountService } from '../../services/account.service';
import { NotificationService } from '../../services/notification.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-refresh-accounts',
  template: `
    <button mat-icon-button 
            (click)="refreshAccounts()"
            [matTooltip]="'ACCOUNT.REFRESH' | translate"
            class="refresh-button">
      <mat-icon>refresh</mat-icon>
    </button>
  `,
  styles: [`
    .refresh-button {
      margin: 0 4px;
    }
  `]
})
export class RefreshAccountsComponent {
  constructor(
    private accountService: AccountService,
    private notificationService: NotificationService,
    private translate: TranslateService
  ) {}

  refreshAccounts() {
    this.accountService.refreshAccounts().subscribe({
      next: () => {
        this.notificationService.showTranslatedSuccess('ACCOUNT.REFRESH_SUCCESS');
      },
      error: () => {
        this.notificationService.showTranslatedError('ACCOUNT.REFRESH_ERROR');
      }
    });
  }
}