import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) { }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['toast-success']
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['toast-error']
    });
  }

  showWarning(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: ['toast-warning']
    });
  }

  showTranslatedSuccess(key: string): void {
    this.translate.get(key).subscribe((message: string) => {
      this.showSuccess(message);
    });
  }

  showTranslatedError(key: string): void {
    this.translate.get(key).subscribe((message: string) => {
      this.showError(message);
    });
  }

  showTranslatedWarning(key: string): void {
    this.translate.get(key).subscribe((message: string) => {
      this.showWarning(message);
    });
  }
}