import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, OnInit, Output, QueryList, ViewChild, ViewChildren, EventEmitter, Inject } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatDatepicker, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Router } from '@angular/router';
import { DisplayDay, DisplayMonth } from '@core/models/datepicker.interface';
import { DateService } from '@core/services/date/date.service';
import { DatePickerHeaderComponent } from '@shared/datepicker/datepicker.component';

@Component({
  selector: 'app-calendar-header',
  templateUrl: './calendar-header.component.html',
  styleUrls: ['./calendar-header.component.scss']
})
export class CalenderHeaderComponent implements OnInit {
  selectedDay: string;
  selectedMonth: DisplayMonth;
  selectedDate : Date | null = null;
  daysOfSelectedMonth: Array<DisplayDay>; 
  showDatepicker = false;

  datepickerHeader = DatePickerHeaderComponent;
  
  private _resetDateBtnDisabled: boolean;

  /**
    * Disable button to reset date to today
    */
  get resetDateDisabled(): boolean {
    return this._resetDateBtnDisabled;
  }

  /**
   * Set if button should be disabled
   */
  set resetDateDisabled(value: boolean) {
    this._resetDateBtnDisabled = value;
  }

  /**
   * Check if element is in viewport
   * TODO: Fix
   */
  get isInViewport(): boolean {
    const selectedDay = this._days.find((day) => day?.nativeElement.classList.contains('selected'));
    const rect = selectedDay?.nativeElement.getBoundingClientRect();

    // Check if selected day is in view
    const isInViewport = rect?.top >= 0 &&
    rect?.left >= 0 &&
    rect?.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect?.right <= (window.innerWidth || document.documentElement.clientWidth);

    return isInViewport;
  }

  @Output() readonly pickedDate = new EventEmitter<Date>(); 
  @Output() readonly actualDate = new EventEmitter<Date>(); 

  @ViewChild('datepicker', {static: false}) private _datepicker: MatDatepicker<any>;
  @ViewChild('datepickerFooter', {static: false}) private _datepickerFooter: ElementRef;
  @ViewChildren('days') private _days: QueryList<ElementRef>; 
  
  constructor(
    private _dateAdapter: DateAdapter<Date>,
    private _dateService: DateService,
    private _router: Router,
    @Inject(DOCUMENT) private _document: Document
  ) {
    // this._document.body.style.overflow = 'hidden';
  }

  ngOnInit(): void {
    this._datepickerSettings();
    this._getActualDate();
    this._setActualDate();
    this._setLabels();
    this.pickedDate.emit(this.selectedDate);
  }

  /**
   * Navigate to upcoming (events/todos) page
   */
  navigateToUpcoming(): void {
    this._router.navigateByUrl('/upcoming');
  }

  /**
   * Date has changed (via datepicker)
   */
  onDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.selectedDate = event.value;
    this._setLabels(event.value);
    this.pickedDate.emit(this.selectedDate);
  }

  /**
   * Append custom datepicker footer when it's opened 
   */
  onDatepickerOpen(): void {
    this._appendDatepickerFooter();
    this._setLabels(this.selectedDate);
    this.showDatepicker = true;
  }
  
  /**
   * Day changed (outside datepicker)
   */
  dayDateChange(day: DisplayDay): void {
    this.selectedDay = day.number;
    this.selectedDate = day.date;
    this.pickedDate.emit(this.selectedDate);
    setTimeout(() => this._scrollSelectedDayIntoView(true), 400);
  }

  /**
   * Select today (inside datepicker)
   */
  today(): void {
    this._setActualDate();
    this._setLabels(this.selectedDate);
    this.pickedDate.emit(this.selectedDate);
    this._datepicker.close();
  }

  /**
   * Scrolling in calendar's days container 
   */
  daysOnScroll(): void {
    // Check if selected date is actual date
    const selectedDateIsActualDate = this._dateService.isToday(this.selectedDate); 

    // Disable reset date btn when day is in view and selected date is actual date 
    this._resetDateBtnDisabled = this.isInViewport && selectedDateIsActualDate;
  }
  
  /**
   * Set actual date
   */
  private _setActualDate(): void {
    this.selectedDate = this._dateService.actualDate(); 
  }

  /**
   * Get actual date
   */
  private _getActualDate(): void {
    this.actualDate.emit(this._dateService.actualDate());
  }

  /**
   * Settings for datepicker (language, layout)
   */
  private _datepickerSettings(): void {
    this._dateAdapter.setLocale('de');
    // TODO: Fix 
    // this._dateAdapter.getFirstDayOfWeek = () => { return 1; }
  }

  /**
   * Append custom datepicker footer 
   */
  private _appendDatepickerFooter(): void {
    const matCalendar = document.getElementsByClassName('mat-datepicker-content')[0] as HTMLElement;
    matCalendar.appendChild(this._datepickerFooter.nativeElement);
  }
    
  /**
   * Set month and day labels
   */
  private _setLabels(date?: Date): void {
    this._setMonthLabel(date);
    this._setDaysLabel();
  }
  
  /**
   * Get days of selected month (incl. name, number, date)
   */
  private _setDaysLabel(): void {
    // Empty values
    this.daysOfSelectedMonth = [];
    this.selectedDay = null;
    
    // Get all necessary data 
    const month = this.selectedMonth.date.getMonth() + 1;
    const selectedDateMonth = this.selectedDate.getMonth() + 1;
    const year = this.selectedMonth.date.getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();

    // Get name and date (number) of every day in selected month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i);
      const dayName = this._dateService.dayNameShort(date);
      let dayNumber = i.toString(); 

      // Add zero infront of day that has only one digit
      if (dayNumber.length == 1) {
        dayNumber = "0" + dayNumber;
      }

      // Check if day is selected
      if (selectedDateMonth === month && date.valueOf() === this.selectedDate.valueOf()) {
        this.selectedDay = dayNumber;
      }
      
      // Push day with name and date to array for display
      this.daysOfSelectedMonth.push({day: dayName, number: dayNumber, date, past: this._dateService.isPast(date)});
    }

    // Scroll day into view
    setTimeout(() => this._scrollSelectedDayIntoView(false), 400);
  }
  
  /**
   * Set month label for user interface
   * @param date optional if not use actual date
   */
  private _setMonthLabel(date?: Date): void {
    const selectedDate = date ? new Date(date) : new Date();
    selectedDate.setHours(0,0,0,0); 

    const displayMonths = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const month = selectedDate.getMonth(); 
    const year = selectedDate.getFullYear();

    this.selectedMonth = {display: `${displayMonths[month]} ${year}`, date: selectedDate};
  }  

  /**
   * Scroll selected day into view 
   */
  private _scrollSelectedDayIntoView(smooth = false): void {
    const selectedDay = this._days.find((day) => day.nativeElement.classList.contains('selected'));
    if (selectedDay?.nativeElement) {
      selectedDay.nativeElement.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center', inline: 'center' }); 
    }
  }
}
