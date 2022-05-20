import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  static readonly DURATION = {duration: 1000};
  notificationStatus = {
    error: 'Error',
    warning: 'Warning',
    success: 'Success',
  }; 

  constructor(
    private _snackBar: MatSnackBar
  ) { }

  /**
   * Show error notification 
   */
  showError(msg: string): void {
    this._snackBar.open(msg, this.notificationStatus.error, NotificationService.DURATION);
  }
}
