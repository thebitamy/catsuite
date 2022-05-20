import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
} from '@angular/core';
import { MatCalendar } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MatDateFormats } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DisplayHeader } from '@core/models/datepicker.interface';

/** Custom header component for datepicker. */
@Component({
  selector: 'app-datepicker-header',
  styleUrls: ['./datepicker.component.scss'],
  templateUrl: './datepicker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePickerHeaderComponent<D> implements OnDestroy {
  currentView = DatePickerHeaderComponent.YEAR;
  customHeader = DatePickerHeaderComponent;

  static readonly YEAR = 'year';
  static readonly MONTH = 'month';
  static readonly MULTI_YEAR = 'multi-year';

  private _destroyed = new Subject<void>();

  constructor(
      private _calendar: MatCalendar<D>, 
      private _dateAdapter: DateAdapter<D>,
      @Inject(MAT_DATE_FORMATS) private _dateFormats: MatDateFormats, 
      cdr: ChangeDetectorRef
  ) {
    _calendar.stateChanges
        .pipe(takeUntil(this._destroyed))
        .subscribe(() => cdr.markForCheck());
  }

  ngOnDestroy(): void {
    this._destroyed.next();
    this._destroyed.complete();
  }

  /**
   * Get header label 
   */
  get headerLabel(): DisplayHeader {
    const date = this._dateAdapter.format(this._calendar.activeDate, this._dateFormats.display.monthYearLabel);
    let label: string;
    
    if (this._calendar.currentView === DatePickerHeaderComponent.MULTI_YEAR) {
      label = 'Jahre';
    } else if (this._calendar.currentView === DatePickerHeaderComponent.MONTH) {
      label = date;
    } else {
      label = date.replace(/\D/g,'');
    }

    return {display: label, currentView: this._calendar.currentView};
  }

  /**
   * Show previous last month or year in calendar 
   */
  previousClicked(): void {
    const mode = this._calendar.currentView === 'month' ? 'month' : 'year'; 
    this._calendar.activeDate = mode === 'month' ?
        this._dateAdapter.addCalendarMonths(this._calendar.activeDate, -1) :
        this._dateAdapter.addCalendarYears(this._calendar.activeDate, -1);
  }

  /**
   * Show next month or year in calendar
   */
  nextClicked(): void {
    const mode = this._calendar.currentView === 'month' ? 'month' : 'year'; 
    this._calendar.activeDate = mode === 'month' ?
        this._dateAdapter.addCalendarMonths(this._calendar.activeDate, 1) :
        this._dateAdapter.addCalendarYears(this._calendar.activeDate, 1);
  }

  /**
   * Show year or multi year view in calendar
   */
   toggleYearView(): void {
    if (this.headerLabel.currentView === DatePickerHeaderComponent.YEAR) {
      this._calendar.currentView = DatePickerHeaderComponent.MULTI_YEAR;
    } else if (this.headerLabel.currentView === DatePickerHeaderComponent.MULTI_YEAR) {
      this._calendar.currentView = DatePickerHeaderComponent.YEAR;
    }
  }

  /**
   * Show year view in calendar
   */
  yearView(): void {
    this._calendar.currentView = DatePickerHeaderComponent.YEAR;
  }
}
