import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { DateService } from '@core/services/date/date.service';
import { DatePickerHeaderComponent } from '@shared/datepicker/datepicker.component';
import { EntryType } from '@core/enums/planner.enum';
import { Appointment, Todo } from '@core/models/planner.interface';
import { AuthService } from '@core/http/authentication/authentication';

@Component({
  selector: 'app-editor-bottom',
  templateUrl: './editor-bottom.component.html',
  styleUrls: ['./editor-bottom.component.scss']
})
export class EditorBottomComponent implements OnInit {
  showTimeEditor = false;
  showDatepicker = false;
  showEditor = false;

  entryType = 2;
  form: FormGroup = new FormGroup({
    id: new FormControl(),
    name: new FormControl('', [Validators.required]),
    date: new FormControl(),
    time: new FormControl(),
    order: new FormControl(),
    user_id: new FormControl(true),
  });

  datepickerHeader = DatePickerHeaderComponent;
  
  private _time: string = null;
  private _submitted = false;
  private _timepickerCount: number = 0;
  private _selectedDate: Date = null;

  /**
  * Display string for selected time
  * Shows time, no time or shows hint that time should be added (because required for appointment)
  */
  get displayTime(): string {
    if (this._time) {
      return this._time;
    }

    if (this.entryType === EntryType.Todo) {
      return 'Keine Uhrzeit';
    }

    if (this.entryType === EntryType.Appointment) {
      return 'Uhrzeit hinzufügen';
    }
  }

  /**
   * Display date for seleted date
   */
  get displayDate(): string {
    let display: string;
    const date = this.form.get('date').value;
    
    if (!date) {
      display = 'Kein Datum';
    } else if (this._dateService.isToday(date)) {
      display = 'Heute';
    } else {
      display = this._dateService.formatDateForDisplay(date);
    }
    return display;
  }

  /**
   * Only show selection for entry type when adding a new entry 
   */
  get showSelection(): boolean {
    return !this.form.get('id').value;
  }

  /**
   * Date is selected
   */
  get dateSelected(): boolean {
    return !!this.form.get('date').value;
  } 

  /**
   * Show if entry is collaboration
  */
  get showCollab(): boolean {
    return !!!this.form.get('user_id').value;
  }

  /**
   * Width of timepicker input (which is not visible for user)
   */
  get timeInputWidth(): string {
    return this.showRemoveTime ? 'calc(100% - 17px)' : '100%';
  }

  /**
   * Width of datepicker input (which is not visible for user)
   */
  get dateInputWidth(): string {
    return this.showRemoveDate ? 'calc(100% - 17px)' : '100%';
  }

  /** 
   * Only show option to remove date for todos
   */
  get showRemoveDate(): boolean {
    return this.dateSelected && this.entryType === EntryType.Todo;
  }

  /** 
   * Only show option to remove time for todos
   */
  get showRemoveTime(): boolean {
    return this._time && this.entryType === EntryType.Todo;
  }
  
  /**
   * Show error if user submitted form and input has no value
   */
  get nameError(): boolean {
    return this._submitted && !!!this.form.get('name').value?.length;
  }
  
  /**
   * Show error if user submitted appointment form and no date is selected
   */
  get dateError(): boolean {
    return this._submitted && !this.dateSelected && this.entryType === EntryType.Appointment;
  }
  
  /**
   * Show error if user submitted appointment form and no time is selected
   */
  get timeError(): boolean {
    return this._submitted && !!!this._time && this.entryType === EntryType.Appointment;
  }

  @Input() 
  set show(value: boolean) {
    this.showEditor = value; 

    // If editor is open then focus input
    if (value) {
      // Set time out - execution after the above boolean has changed
      setTimeout(() => this._editorInput?.nativeElement.focus());
    } else {
      // If close editor then reset editor
      this.resetEditorView();
    }
  }

  @Input() 
  set showCollabIcon(value: boolean) {
    this.form.get('user_id').setValue(value);
  }

  @Input() 
  set date(value: Date) {
    // Set date to editor 
    this._selectedDate = value; 
    this.form.get('date').setValue(value);
  }

  @Output() readonly showChange = new EventEmitter<boolean>();
  @Output() readonly submitEntry = new EventEmitter<Appointment | Todo>();

  @ViewChild('editorOverlay', { static: false }) private _editorOverlay: ElementRef;
  @ViewChild('editorInput', { static: false }) private _editorInput: ElementRef;

  @HostListener('document:click', ['$event'])
  clickOutsideEditor(event: MouseEvent) {
    // Close & reset editor when click outside
    if (this._editorOverlay?.nativeElement?.contains(event.target)) {
      this.showEditor = this.showDatepicker = this.showTimeEditor = false;
      this.showChange.emit(this.showEditor);
      this.resetEditorView(false);
    }

    // Adjust height of editor when time picker is closed
    if (this._editorOverlay?.nativeElement?.contains(event.target)) {
      this.showTimeEditor = this.showDatepicker = false;
    }
  }

  constructor(
    private _dateService: DateService,
    private _authHttpService: AuthService, 
  ) { }

  ngOnInit(): void {
    this._formValueWatcher();
  }

  /**
   * Add new appointment or todo to selected date 
   */
  addOrEdit(): void {
    this._submitted = true;
    if (this.form.invalid) {
      return;
    }

    // Submit data
    this.submitEntry.emit(this._getFormattedData());
  }

  /**
   * Open editor and focus input
   */
  openEditor(): void {
    this.showEditor = !this.showEditor;
    
    if (this.showEditor) {
      setTimeout(() => this.focusEditorInput()); 
    }
  }

  /**
   * Change sort of entry
   */
  focusEditorInput(): void {
    this._setFormValidators();
    this._focusInput();
  }

  /**
   * Close time- & datepicker
   */
  closeTimeDate(): void {
    this.closeDatepicker();
    this._closeTimepicker();
    this._focusInput();
  }
  
  /**
   * Toggle assignment - collab or single task
   */
  toggleCollab(): void {
    this.form.get('user_id').setValue(this.showCollab ? this._authHttpService.supabase.auth.user().id.toString() : null); 
  }

  /**
    * Resets editor input and selected time for added entry
    */
  resetEditorView(resetEntryType = true): void {
    if (!resetEntryType) {
      this.entryType = EntryType.Todo;
    }

    // Set submitted to false to remove form validation errors (if there are any)
    this._submitted = false;

    // Reset form & set date to today
    this.form.reset();
    this._setFormValidators();
    this.form.get('date').setValue(this._selectedDate);
    this.form.get('user_id').setValue(this._authHttpService.supabase.auth.user().id.toString());

    // Reset time & timepicker
    this._time = null;
    this._timepickerCount = 0;
    this._closeTimepicker();
  }

  onDateChange(event: Date): void {
    this.form.get('date').setValue(event);  
  }
  
  /**
   * Open datepicker and style it 
   */
  openDatepicker(): void {
    this.showDatepicker = true;

    // Choose elements
    const matCalendar = document.getElementsByClassName('mat-calendar')[0] as HTMLElement;
    const matContent = document.getElementsByClassName('mat-datepicker-content')[0] as HTMLElement;
    const matOverlay = document.getElementsByClassName('cdk-overlay-backdrop')[0] as HTMLElement;
    
    // Style calendar
    matCalendar.style.width = '88vw';
    matCalendar.style.marginTop = '20px';
    matContent.style.marginTop = '5px';
    
    // Style overlay
    matOverlay.style.height = '420px';
    matOverlay.style.top = 'unset';
    matOverlay.style.background = 'var(--black-transparent-quarter)';
    matOverlay.style.bottom = '60px';
  }

  /** 
   * Close datepicker in editor 
   */
  closeDatepicker(): void {
    this.showDatepicker = false;
  }  

  /**
   * Format and set values to form 
   * @param values of appointment or todo entry
   */
  setFormValues(values: Appointment | Todo): void {
    this.showChange.emit(true); 
    values.date = values.date ? new Date(values.date) : null;
    this.form.patchValue(values);
    this._time = this.form.get('time').value;
  }

  /**
   * Remove date from editor
   */
  removeDate(): void {
    this.showDatepicker = false
    this.form.get('date').reset();
  }

  /**
   * Remove time from editor
   */
  removeTime(): void {
    this._time = null;
    this.form.get('date').reset();
  }

  /**
   * Time has been picked via timepicker
   * @param event string format (e.g. 05:00)
   */
  timeChanged(event: string): void {
    this._timepickerCount++;
    
    // Close timepicker after choosing hour and minutes in timepicker
    if (this._timepickerCount === 2) {
      this._timepickerCount = 0;
      this.form.get('time').setValue(event);
      this._time = this.form.get('time').value;
      this._closeTimepicker();
    } 
  }

  /**
   * Open timepicker
   */
  openTimepicker(): void {
    this.showTimeEditor = !this.showTimeEditor;
  }

  /**
   * Format data - remove properties that has no values
   * @returns data 
   */
  private _getFormattedData(): Appointment | Todo {
    const values = this.form.getRawValue();
    const dataObj: any = {};
    for (let value in values) {
      if (values[value]) {
        dataObj[value] = value === 'date' ? this._dateService.formatDateToTimestampTz(values[value]) : values[value];
      }
    }
    dataObj.user_id = values.user_id;
    return dataObj;
  }

  /**
   * Set form validators for date & time
   */
  private _setFormValidators(): void {
    const controls = [this.form.get('date'), this.form.get('time')];
    
    controls.forEach((control) => {
      //  Set or clear validators 
      this.entryType === EntryType.Appointment ? control.setValidators(Validators.required) : control.clearValidators();
      
      // Update value & validity of form control
      control.updateValueAndValidity();
    }); 
  }

  /**
   * Observe form changes
   */
  private _formValueWatcher(): void {
    this.form.valueChanges.subscribe(() => {
      // Sets submitted to false to hide input error styling until user submits form again
      this._submitted = false;
    });
  }

  /** 
   * Close timepicker in editor 
   */
  private _closeTimepicker(): void {
    const timepickerOverlay = document.getElementsByClassName('timepicker-backdrop-overlay')[0] as HTMLElement;
    timepickerOverlay?.click();
  }

  /**
   * Focus editor input
   */
  private _focusInput(): void {
    this._editorInput?.nativeElement.focus();
  }
}
