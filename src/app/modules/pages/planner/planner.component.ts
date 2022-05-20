import { Component, OnDestroy, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { RealtimeSubscription } from '@supabase/supabase-js';

import { PlannerService } from '@core/http/planner/planner.service';
import { DateService } from '@core/services/date/date.service';
import { NotificationService } from '@core/services/notification/notification.service';
import { EditorBottomComponent } from 'src/app/modules/components/editor-bottom/editor-bottom.component';
import { Appointment, Meal, MealPlan, MultiActionEvent, Todo } from '@core/models/planner.interface';
import { Tables } from '@core/enums/http-tables.enum'; 
import { EntryType } from '@core/enums/planner.enum';
import { Multiaction } from '@core/enums/multiaction.enum';

@Component({
  selector: 'app-planner',
  templateUrl: './planner.component.html',
  styleUrls: ['./planner.component.scss'],
})
export class PlannerComponent implements OnInit, OnDestroy {
  mealPlan: MealPlan; 
  todos: Array<Todo> = [];
  appointments: Array<Appointment> = [];

  showMealPlan = true;
  showEditor = false; 
  showTimeEditor = false;

  selectedDate: Date | null = null;
  actualDate: Date;
  entryTypeEnum = EntryType;

  private _changesMealPlan$: RealtimeSubscription; 
  private _changesAppointments$: RealtimeSubscription; 
  private _changesTodos$: RealtimeSubscription; 

  @ViewChild(EditorBottomComponent) private _editorBottom: EditorBottomComponent;

  constructor(
    private _plannerHttp: PlannerService,
    private _dateService: DateService, 
    private _notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.getShowMealPlanValue();
    this._changesNotifierMealPlan();
    this._changesNotifierAppointments();
    this._changesNotifierTodos();
    this._plannerHttp.authStateChange();
  }

  ngOnDestroy(): void {
    this._changesMealPlan$.unsubscribe();
    this._changesAppointments$.unsubscribe();
    this._changesTodos$.unsubscribe();
  }

  /**
   * Initial data loading / load data if date has changed
   * @param date object
   */
  onDateChange(date: Date): void {
    this.selectedDate = date;
    this.todos = [];
    this.appointments = [];

    this._getData();
  }

  /**
   * Add meal plan to selected date 
   */
  addMeal(): void {
    console.log('add meal')
  }

  /**
   * Toggle meal plan - show / hide
   */
  toggleMealPlan(): void {
    this.showMealPlan = !this.showMealPlan;
    localStorage.setItem('showMealPlan', this.showMealPlan.toString());
  }

  getShowMealPlanValue(): void {
    this.showMealPlan = localStorage.getItem('showMealPlan') === 'true';
  }

  /**
   * Add or update entry (appointment or entry)
   * @param event is entry from editor
   */
  submitEntry(event: Appointment | Todo): void {
    // Todo
    if (this._editorBottom.entryType === EntryType.Todo) {
      event.id ? this.updateTodo(event) : this.addTodo(event);
    }

    // Appointment
    if (this._editorBottom.entryType === EntryType.Appointment) {
      event.id ? this.updateAppointment(event) : this.addAppointment(event);
    }
  }

  /**
   * Opens appointment in editor 
   * Set value of appointment (that should be edited) to the editor 
   */
  openAppointment(item: Appointment): void {
    // Get index of item
    const index = this.appointments.indexOf(item);

    // Set values to bottom editor
    this._editorBottom.setFormValues(this.appointments[index]);
    this._editorBottom.entryType = item.type;
  }

  /**
    * Add appointment to selected day
    * @param event id, name, date and time (optional)
    */
  addAppointment(event: Appointment): void {
    this._plannerHttp.addData<Appointment>(Tables.Appointments, event).then(
      async (data: Array<Appointment>) => {
        // Format time string for display
        let entry: Appointment = data[0];
        if (entry.time) {
          entry.time = this._dateService.formatTimeForDisplay(entry.time); 
        }

        // Check if appointment is already expired
        entry.past = this._appointmentIsExpired(entry);
        
        // Add item to appointment array 
        this.appointments.push(entry);

        // Sort appointment by time
        this.appointments.sort((a, b) => a.time.localeCompare(b.time));

        // Reset editor
        this._editorBottom.resetEditorView();
      }, 
      async error => this._notificationService.showError('Termin konnte nicht hinzugefügt werden.'),
    );
  }

  /**
   * Update selected appointment 
   * @param event id, name, date and time (optional)
   */
  updateAppointment(event: Appointment): void {
    this._plannerHttp.updateEntry(Tables.Appointments, event).then(
      async (data: Array<Appointment>) => {
        // Reload list
        this._getAppointments();

        // Reset & close everything
        this.showEditor = false;
      }, 
      async error => this._notificationService.showError('Termin konnte nicht aktualisiert werden.'),
      );
  }

  /**
   * Delete selected appointment
   */
  deleteAppointment(item: Appointment): void {
    this._plannerHttp.deleteEntry(Tables.Appointments, item.id.toString()).then(
      async (data: Array<Appointment>) => {
        const index = this.appointments.indexOf(item);
        this.appointments.splice(index, 1);
        this.appointments = this.appointments.concat([]); 
      },
      async error => this._notificationService.showError('Termin konnte nicht gelöscht werden.'),
    )
  }

  /**
   * Multiselection appointment (update date, delete)
   * @param event - action type, selected items and date (optional)
   */
  multiactionAppointment(event: MultiActionEvent): void {
    if (event.action === Multiaction.UpDate) {
      this._changeDateOfAppointments(event.date, event.list);
    }

    if (event.action === Multiaction.Delete) {
      this._deleteAppointments(event.list); 
    }
  }

  /**
   * Set value of todo (that should be edited) to the editor 
   */
  openTodo(item: Todo): void {
    // Get index of todo
    const index = this.todos.indexOf(item);

    // Set values to bottom editor
    this._editorBottom.setFormValues(this.todos[index]);
    this._editorBottom.entryType = item.type;
  }


  /**
   * Add todo to selected day
   * @param reqObj name, date and time (optional)
   */
  addTodo(event: Todo): void {
    // Create deep copy of todo and sort by order to get the todo with the highest order number
    const list = JSON.parse(JSON.stringify(this.todos));
    list.sort((a, b) => {
      return a.order - b.order;
    });

    // If todo list has no entry set order to 0 otherwise set the order + 1 of the todo with the highest order number
    // We do not set order to length of array + 1 because we have the option to delete items from the list
    event.order = list.length === 0 ? list.length : list[list.length - 1].order + 1;
    this._plannerHttp.addData<Todo>(Tables.Todos, event).then(
      async (data: Array<Todo>) => {
        // Reset editor 
        this._editorBottom.resetEditorView();
      }, 
      async error => this._notificationService.showError('Aufgabe konnte nicht hinzugefügt werden.'));
  }

  /**
   * Update selected todo 
   * @param event id, name, date and time (optional)
   */
  updateTodo(event: Todo): void {
    this._plannerHttp.updateEntry(Tables.Todos, event).then(
      async (data: Array<Todo>) => {
        // Reload list 
        this._getTodos();

        // Reset & close everything
        this.showEditor = false;
      }, 
      async error => this._notificationService.showError('Aufgabe konnte nicht aktualisiert werden.'));
  }

  /**
   * Mark selected todo item as done / undone
   * @param index of array 
   */
  markTodo(item: Todo): void {
    // Request
    this._plannerHttp.markTodo(item.id, item.done).then(
      async (data: Array<Todo>) => this._getTodos(), 
      async error => {
        // Error: Undone changes 
        this._notificationService.showError('Aufgabe konnte nicht abgehakt werden.'); 
        item.done = !item.done; 
      }
    );  
  }

  /**
   * Change order numbers of todos list
   */
  changeTodosOrder(list: Array<Todo>) {
    list.forEach((item, index) => {
      item.order = index;
      // TODO: Find a better solution (supabase update multiple rows with dynamic values)
      this._plannerHttp.changeTodosOrder(item.order, item.id.toString()).then(
        async (data: Array<Todo>) => null,
        async error => {
          this._getTodos();
          this._notificationService.showError('Die Reihenfolge der Aufgaben konnte nicht geändert werden.');
        })
    }) 
  }

  /**
   * Delete selected todo
   */
  deleteTodo(item: Todo): void {
    this._plannerHttp.deleteEntry(Tables.Todos, item.id.toString()).then(
      async (data: Array<Todo>) => {
        const index = this.todos.indexOf(item);
        this.todos.splice(index, 1);
        this.todos = this.todos.concat([]); 
      },
      async error => this._notificationService.showError('Aufgabe konnte nicht gelöscht werden.'),
    )
  }

  /**
   * Multiaction for todo (update date or delete )
   */
  multiactionTodo(event: MultiActionEvent): void {
    if (event.action === Multiaction.UpDate) {
      this._changeDateOfTodos(event.date, event.list);
    }

    if (event.action === Multiaction.Delete) {
      this._deleteTodos(event.list); 
    }
  }

  /**
   * Get all data for selected day 
   */
  private _getData(): void {
    this._getMealPlan();
    this._getTodos();
    this._getAppointments();
  }

  /**
   * Get meal plan for selected day 
   * @param date actual or selected
   */
  private _getMealPlan(): void {
    this._plannerHttp.getMealPlan(this.selectedDate).then(
      async (data: Array<MealPlan>) => this.mealPlan = data[0], 
      async error => this._notificationService.showError('Essensplan konnte nicht geladen werden.'), 
    );
  }

  /**
   * Listen to changes in meal database & reload plan
   */
  private _changesNotifierMealPlan(): void {
    this._changesMealPlan$ = this._plannerHttp.handleMealPlanChanged().on('*', plan => {
      const isSameDate = this._dateService.isSameDate(new Date(plan.new.date), this.selectedDate);
      // If collab & one has a day selected and other one has added new todo to the same day
      if (isSameDate) {
        // Reload to show the first one the new added entry
        this._getMealPlan();
      }
    })
    .subscribe();  
  }

  /**
   * Get appointments for selected day
   * @param date actual or selected
   */
  private _getAppointments(): void {
    this._plannerHttp.getAppointments(this.selectedDate).then(
      async (data: Array<Appointment>) => this.appointments = this._formatList(data, Tables.Appointments), 
      async error => this._notificationService.showError('Termine konnten nicht geladen werden.'),
    );
  }

  /**
   * Update date of multiple selected todos
   */
  private _changeDateOfAppointments(date: Date, idList: Array<number>): void {
    this._plannerHttp.updateEntries(Tables.Appointments, idList, date).then(
      async (data: Array<Appointment>) => {
        this._getAppointments();
      },
      async error => this._notificationService.showError('Ausgewählte Termine konnten nicht aktualisiert werden.'),
    );
  }

  /** 
   * Delete multiple selected appointments 
   */
  private _deleteAppointments(idList: Array<number>): void {
    this._plannerHttp.deleteEntries(Tables.Appointments, idList).then(
      async (data: Array<Appointment>) => {
        this._getAppointments();
      },
      async error => this._notificationService.showError('Ausgewählte Termine konnten nicht gelöscht werden.'),
    );
  }

  /**
   * Check if appointments are already expired
   * @param appointment item 
   * @returns if expired (boolean) 
   */
  private _appointmentIsExpired(appointment: Appointment): boolean {
    let isExpired: boolean;

    if (this._dateService.isPast(this.selectedDate)) {
      isExpired = true;
    } else if (this._dateService.isToday(this.selectedDate)) {
      isExpired = appointment.time < this._dateService.actualTime();
    } else {
      isExpired = false;
    }
    
    return isExpired; 
  }
  
  /**
   * Listen to changes in appointments database & reload list
   */
  private _changesNotifierAppointments(): void {
    this._changesAppointments$ = this._plannerHttp.handleAppointmentsChanged().on('*', appointment => {
      const isSameDate = this._dateService.isSameDate(new Date(appointment.new.date), this.selectedDate);
      // If collab & one has a day selected and other one has added new todo to the same day
      if (!appointment.new.user_id && isSameDate) {
        // Reload to show the first one the new added entry
        this._getAppointments();
      }
    })
    .subscribe();  
  }

  /**
   * Format data of list
   * For appointments array: Check if time is expired
   * @param list todo or appointment array 
   * @returns the whole array
   */
  private _formatList(list: Array<Appointment | Todo>, table?: string): Array<any> {
    list.forEach((item: any) => {
      if (table === Tables.Appointments) {
        item['past'] = this._appointmentIsExpired(item);
        item['type'] = EntryType.Appointment;
      }

      if (table === Tables.Todos) {
        item['type'] = EntryType.Todo;
      }

      if (item.time) {
        item.time = this._dateService.formatTimeForDisplay(item.time); 
      }
    }); 
    return list;
  }

  /**
   * Get to dos for selected day
   * @param date actual or selected 
   */
  private _getTodos(): void {
    this._plannerHttp.getTodos(this.selectedDate).then(
      async (data: Array<Todo>) => {
        this.todos = this._formatList(data, Tables.Todos);
      }, 
      async error => this._notificationService.showError('Aufgaben konnten nicht geladen werden.'),
    );
  }

  /**
   * Update date of multiple selected todos
   */
  private _changeDateOfTodos(date: Date, idList: Array<number>): void {
    this._plannerHttp.updateEntries(Tables.Todos, idList, date).then(
      async (data: Array<Todo>) => {
        this._getTodos();
      },
      async error => this._notificationService.showError('Ausgewählte Aufgaben konnten nicht aktualisiert werden.'),
    );
  }
    
  /**
   * Delete multiple selected todos
   */
  private _deleteTodos(idList: Array<number>): void {
    this._plannerHttp.deleteEntries(Tables.Todos, idList).then(
      async (data: Array<Todo>) => {
        this._getTodos();
      },
      async error => this._notificationService.showError('Ausgewählte Aufgaben konnten nicht gelöscht werden.'),
    );
  }

  /**
   * Listen to changes in todos database & reload list
   */
  private _changesNotifierTodos(): void {
    this._changesTodos$ = this._plannerHttp.handleTodosChanged().on('*', todo => {
      const isSameDate = this._dateService.isSameDate(new Date(todo.new.date), this.selectedDate);
      // If collab & one has a day selected and other one has added new todo to the same day   
      // OR if user added new todo to own plan then reload to show entries in correct order
      if ((!todo.new.user_id && isSameDate) || todo.new.user_id === this._plannerHttp.supabase.auth.user().id) {
        this._getTodos();
      }
    })
    .subscribe();  
  }
}
