import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountService } from '../../services/account.service';
import { TransferService } from '../../services/transfer.service';
import { NotificationService } from '../../services/notification.service';
import { Account } from '../../models/account.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-transfer-simulation',
  templateUrl: './transfer-simulation.component.html',
  styleUrls: ['./transfer-simulation.component.scss']
})
export class TransferSimulationComponent implements OnInit {
  transferForm: FormGroup;
  accounts: Account[] = [];
  selectedFromAccount: Account | null = null;
  selectedToAccount: Account | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private transferService: TransferService,
    private notificationService: NotificationService,
    private translate: TranslateService
  ) {
    this.transferForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.setupFormListeners();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      fromAccount: ['', Validators.required],
      toAccount: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01), Validators.max(100000)]],
      description: ['']
    });
  }

  private loadAccounts(): void {
    this.accountService.getAccounts().subscribe(accounts => {
      this.accounts = accounts;
    });
  }

  private setupFormListeners(): void {
    this.transferForm.get('fromAccount')?.valueChanges.subscribe(accountId => {
      this.selectedFromAccount = this.accounts.find(acc => acc.id === accountId) || null;
      this.validateForm();
    });

    this.transferForm.get('toAccount')?.valueChanges.subscribe(accountId => {
      this.selectedToAccount = this.accounts.find(acc => acc.id === accountId) || null;
      this.validateForm();
    });

    this.transferForm.get('amount')?.valueChanges.subscribe(() => {
      this.validateForm();
    });
  }

  private validateForm(): void {
    const fromAccount = this.transferForm.get('fromAccount');
    const toAccount = this.transferForm.get('toAccount');
    const amount = this.transferForm.get('amount');

    // Validate same account
    if (fromAccount?.value && toAccount?.value && fromAccount.value === toAccount.value) {
      toAccount.setErrors({ sameAccount: true });
    } else if (toAccount?.errors?.['sameAccount']) {
      toAccount.setErrors(null);
    }

    // Validate balance
    if (this.selectedFromAccount && amount?.value) {
      if (amount.value > this.selectedFromAccount.balance) {
        amount.setErrors({ insufficientBalance: true });
      } else if (amount.errors?.['insufficientBalance']) {
        amount.setErrors(null);
      }
    }
  }

  onSubmit(): void {
    if (this.transferForm.valid && this.selectedFromAccount && this.selectedToAccount) {
      this.isSubmitting = true;

      const transferData = {
        fromAccount: this.selectedFromAccount,
        toAccount: this.selectedToAccount,
        amount: this.transferForm.get('amount')?.value,
        description: this.transferForm.get('description')?.value || ''
      };

      this.transferService.simulateTransfer(transferData).subscribe(success => {
        this.isSubmitting = false;
        
        if (success) {
          this.notificationService.showTranslatedSuccess('TRANSFER.SUCCESS');
          this.transferForm.reset();
          this.selectedFromAccount = null;
          this.selectedToAccount = null;
        } else {
          this.notificationService.showTranslatedError('TRANSFER.ERROR');
        }
      });
    }
  }

  getAmountErrorMessage(): string {
    const amountControl = this.transferForm.get('amount');
    
    if (amountControl?.hasError('required')) {
      return this.translate.instant('VALIDATION.REQUIRED');
    } else if (amountControl?.hasError('min')) {
      return this.translate.instant('VALIDATION.MIN_AMOUNT');
    } else if (amountControl?.hasError('max')) {
      return this.translate.instant('VALIDATION.MAX_AMOUNT');
    } else if (amountControl?.hasError('insufficientBalance')) {
      return this.translate.instant('VALIDATION.INSUFFICIENT_BALANCE');
    }
    
    return '';
  }

  getToAccountErrorMessage(): string {
    const toAccountControl = this.transferForm.get('toAccount');
    
    if (toAccountControl?.hasError('required')) {
      return this.translate.instant('VALIDATION.REQUIRED');
    } else if (toAccountControl?.hasError('sameAccount')) {
      return this.translate.instant('VALIDATION.SAME_ACCOUNT');
    }
    
    return '';
  }
}