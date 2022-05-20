import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatDatepicker } from '@angular/material/datepicker';
import { Multiaction } from '@core/enums/multiaction.enum';
import { DatePickerHeaderComponent } from '@shared/datepicker/datepicker.component';

@Component({
  selector: 'app-editor-multiaction',
  templateUrl: './editor-multiaction.component.html',
  styleUrls: ['./editor-multiaction.component.scss']
})
export class EditorMultiactionComponent {
  showDatepicker = false;
  action = Multiaction; 

  datepickerHeader = DatePickerHeaderComponent;

  @Input() disabled: boolean;
  @Output() multiaction = new EventEmitter<any>();

  @ViewChild('datepicker', { static: false }) private _datepicker: MatDatepicker<any>;
  @ViewChild('applyBtn', { static: false }) private _applyBtn: ElementRef;

  /**
    * Open datepicker and style it 
    */
  openDatepicker(): void {
    this.showDatepicker = true;

    // Get elements
    const matCalendar = document.getElementsByClassName('mat-calendar')[0] as HTMLElement;
    const matContent = document.getElementsByClassName('mat-datepicker-content')[0] as HTMLElement;
    const matOverlay = document.getElementsByClassName('cdk-overlay-backdrop')[0] as HTMLElement;

    // Style calendar 
    matCalendar.style.width = '90vw';
    matCalendar.style.marginTop = '20px';
    matContent.style.marginTop = '5px';
    matContent.style.marginBottom = '10px';
    
    // Style overlay
    matOverlay.style.bottom = '50px';

    // Hide apply button - we use a custom button
    this._applyBtn.nativeElement.style.position = 'fixed';
    this._applyBtn.nativeElement.style.bottom = '-200px';
  }

  /**
   * Open datepicker or apply date
   */
  openOrEdit(): void {
    if (this.showDatepicker) {
      this._applyBtn.nativeElement.click();
    } else {
      this._datepicker.open();
    }
  }

  /**
   * Close datepicker
   */
  closeDatepicker(): void {
    this.showDatepicker = false;
    this._datepicker.close();
  }
}
