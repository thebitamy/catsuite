import { Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { RealtimeSubscription } from '@supabase/supabase-js';

import { DateService } from '@core/services/date/date.service';
import { NotificationService } from '@core/services/notification/notification.service';
import { UpcomingService } from '@core/http/upcoming/upcoming.service';
import { PlannerService } from '@core/http/planner/planner.service';

import { EditorBottomComponent } from 'src/app/modules/components/editor-bottom/editor-bottom.component';
import { ListComponent } from '@shared/list/list.component';
import { AssignmentFilter, DateFilter } from '@core/enums/upcoming.enum';
import { EntryType } from '@core/enums/planner.enum';
import { Tables } from '@core/enums/http-tables.enum';
import { Multiaction } from '@core/enums/multiaction.enum';
import { Appointment, MealPlan, MultiActionEvent, Todo } from '@core/models/planner.interface';
import { DisplayListItem, UpcomingFilter } from '@core/models/upcoming.interface';

@Component({
  selector: 'app-upcoming',
  templateUrl: './upcoming.component.html',
  styleUrls: ['./upcoming.component.scss']
})
export class UpcomingComponent implements OnInit, OnDestroy {
  dateFilter: Array<UpcomingFilter> = [
    { display: 'Kein Datum', value: DateFilter.NoDate },
    { display: 'Diese Woche', value: DateFilter.ThisWeek },
    { display: 'Nächste Woche', value: DateFilter.NextWeek },
    { display: 'Diesen Monat', value: DateFilter.ThisMonth },
    { display: 'Nächsten Monat', value: DateFilter.NextMonth },
  ]; 

  listDisplay: Array<any>;
  mealPlan: Array<MealPlan>;
  selectedDate: Date; 
  selectedFilter: number;
  selectedEntryType: number; 
  tabIndex = 0;
  
  showEditor = false;
  showMultiActionBar: boolean;
  searchText = '';
  searchNotifier = new Subject();

  entryTypeEnum = EntryType; 
  assignmentEnum = AssignmentFilter;
  
  @ViewChild(EditorBottomComponent) private _editorBottom: EditorBottomComponent;
  @ViewChildren('lists') private _list: QueryList<ListComponent>; 
  
  private _listAll: Array<any>
  private _changesAppointments$: RealtimeSubscription; 
  private _changesTodos$: RealtimeSubscription; 

  constructor(
    private _router: Router,
    private _upcomingHttp: UpcomingService,
    private _plannerHttp: PlannerService, 
    private _dateService: DateService, 
    private _notificationService: NotificationService,
  ) { }

  // TODO: Shorten filter --> enums from number to text 

  ngOnInit(): void {
    this._setActualDate();
    this._getUpcomingPlans();
    this._searchNotifier();

    this._changesNotifierAppointments();
    this._changesNotifierTodos();
  }

  ngOnDestroy() {
		this.searchNotifier.complete();
    this._changesAppointments$.unsubscribe();
    this._changesTodos$.unsubscribe();
	}

  /**
   * Navigate back to planner
   */
  navigateToPlanner(): void {
    this._router.navigateByUrl('/planner');
  }

  /**
   * Reset search
   */
  resetSearch(): void {
    this.searchText = '';
    this._getUpcomingPlans();
  }

  /** 
   * Filter display list by date
   */
  filterDateInterval(event: number) {
    // If multiselection is activated close multiaction
    if (this.showMultiActionBar) {
      this.closeMultiSelection(); 
    }

    // If clicked filter that already is active - then toggle = deactivate
    if (this.selectedFilter && this.selectedFilter === event) {
      event = DateFilter.NoDate;
      this.selectedFilter = null;
    } else {
      // Highlight selected filter 
      this.selectedFilter = event;
    }

    // Filter display list
    switch(this.selectedFilter) {
      case DateFilter.NoDate:
        this.listDisplay = this._listAll.filter((elem) => !elem.date);
        break; 
      case DateFilter.ThisWeek:
        this.listDisplay = this._listAll.filter((elem) => this._dateService.isInThisWeek(elem.date));
        break; 
      case DateFilter.NextWeek: 
        this.listDisplay = this._listAll.filter((elem) => this._dateService.isNextWeek(elem.date));
        break; 
      case DateFilter.ThisMonth:
        this.listDisplay = this._listAll.filter((elem) => this._dateService.isInThisMonth(elem.date));
        break;
      case DateFilter.NextMonth:
        this.listDisplay = this._listAll.filter((elem) => this._dateService.isInNextMonth(elem.date));
        break;
      default: 
        this.listDisplay = this._listAll;
    }
  }

  /**
   * Filter display list by sort of entry
   */
  filterType(type?: number): void {
    if (this.selectedEntryType && this.selectedEntryType === type) {
      this.selectedEntryType = null;
      this.listDisplay = this._listAll;
    } else {
      const list = [];
      this._listAll.forEach((item) => list.push(item.value.filter((elem) => elem.type === type)));
      this.listDisplay = this._groupByUpcomingList(list.flat()); 
      this.selectedEntryType = type;
    }
  }

  /**
   * Filter display list by assignment
   */
  filterAssignment(type: number): void {
    this.selectedFilter = null;
    this.tabIndex = type;

    // If search input has text -> trigger search with correct assignment
    if (this.searchText?.trim().length) {
      this.searchNotifier.next();
    } else {
      // Else reload with correct assignment or load meal plan
      this.tabIndex === 3 ? this. _getMealPlan() : this._getUpcomingPlans(type); 
    }
  }

  /**
   * Open editor after clicked on list element
   * @param event 
   */
  openEditor(event: Appointment | Todo): void { 
    this._editorBottom.setFormValues(event);
    this._editorBottom.entryType = event.type;
  }

  /**
   * Open multiselection & show multi action bar
   */
  openMultiSelection(): void {
    this._list.forEach((item) => {
      item.openMultiSelection();
    });
    
    this.showMultiActionBar = true;
  }

  /**
   * Close multiselection & hide multi action bar
   */
  closeMultiSelection(): void {
    this._list.forEach((item => {
      item.closeMultiSelection();
    }));

    this.showMultiActionBar = false;
  }

  /**
   * Multiaction - update or delete entries of both sorts (appointment and todo)
   * @param event of multiaction bar
   * TODO: Shorten
   */
  onMultiaction(event: MultiActionEvent): void {
    const multiselectionList = [];
    this._list.forEach((item) => {
      multiselectionList.push(item.multiSelectionList);
    })

    // Get all appointments or todos
    const appointments = JSON.parse(JSON.stringify(multiselectionList)).flat().filter((item) => item.type === EntryType.Appointment);
    const todos = JSON.parse(JSON.stringify(multiselectionList)).flat().filter((item) => item.type === EntryType.Todo);

    // Get all appointment or todo ids
    const appointmentIds: Array<number> = appointments.length ? this._getMultiactionIds(appointments) : null;
    const todosIds = todos.length ? this._getMultiactionIds(todos) : null;

    // Update both or just appointments or just todos
    if (appointmentIds && todosIds) {
      this._multiEntries(event, appointmentIds, todosIds);
    } else if (appointmentIds && !todosIds) {
      this._multiAppointments(event, appointmentIds);
    } else if (!appointmentIds && todosIds) {
      this._multiTodos(event, todosIds); 
    }
  }

  /**
   * Add or update entry (appointment or entry)
   * @param event is entry from editor
   */
  submitEntry(event: Appointment | Todo): void {
    if (this._editorBottom.entryType  === EntryType.Appointment) {
      event.id ? this._updateAppointment(event) : this._addAppointment(event);
    }
  
    if (this._editorBottom.entryType === EntryType.Todo) {
      event.id ? this._updateTodo(event) : this._addTodo(event);
    }
  }

  /**
   * Delete entry (appointment or todo)
   */
  deleteEntry(event: Appointment | Todo): void {
    if (event.type === EntryType.Appointment) {
      this._deleteAppointment(event);
    }

    if (event.type === EntryType.Todo) {
      this._deleteTodo(event); 
    }  
  }

  /**
   * Mark selected todo item as done / undone
   * @param index of array 
   */
  markTodo(item: Todo): void {
    // Request
    this._plannerHttp.markTodo(item.id, item.done).then(
      async (data: Array<Todo>) => this._getUpcomingPlans(), 
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
  changeTodosOrder(list: Array<Todo>): void {
    list.forEach((item, index) => {
      item.order = index;
      // TODO: Find a better solution (supabase update multiple rows with dynamic values)
      this._plannerHttp.changeTodosOrder(item.order, item.id.toString()).then(
        async (data: Array<Todo>) => null,
        async error => {
          this._getUpcomingPlans();
          this._notificationService.showError('Die Reihenfolge der Aufgaben konnte nicht geändert werden.');
        })
    }) 
  }

  /**
   * Search subject subscription
   */
  private _searchNotifier(): void {
    this.searchNotifier
      .pipe(debounceTime(500))
			.subscribe(() => this.searchText.trim().length ? this._searchUpcoming() : this._getUpcomingPlans());
  }

  /**
   * Search entries
   */
  private _searchUpcoming(): void {
    this._upcomingHttp.searchEntries(this.searchText, this.selectedDate, this.tabIndex).then(
      async (data: Array<Appointment | Todo>) => this._mergeLists(data),
      async error => this._notificationService.showError('Die Suche ist fehlgeschlagen.'),
    )
  }
  
  /**
   * Set actual date 
   */
  private _setActualDate(): void {
    this.selectedDate = this._dateService.actualDate();
  }

  /**
   * Get upcoming entries
   */
  private _getUpcomingPlans(type?: number): void {
    this._upcomingHttp.getUpcomingPlans(this.selectedDate, type).then(
      async (data: any) => this._mergeLists(data),
      async error => this._notificationService.showError('Bevorstehende Termine und Aufgaben konnten nicht geladen werden.'),
    )
  }

  /**
   * Get meal plan for selected day 
   * @param date actual or selected
   */
  private _getMealPlan(): void {
    this._upcomingHttp.getMealPlan(this.selectedDate).then(
      async (data: Array<MealPlan>) => {
        // data.forEach((meal) => {
        //    meal['dayName'] = this._getDayName(meal.date);
        // })
        this.mealPlan = data;
      }, 
      async error => this._notificationService.showError('Essensplan konnte nicht geladen werden.'), 
    );
  }

  /**
   * Multiaction for entries of both types (appointment and todo)
   * @param event of multiaction bar
   * @param appointmentIds ids of selected appointments
   * @param todosIds ids of selected todos
   */
  private _multiEntries(event: MultiActionEvent, appointmentIds: Array<number>, todosIds: Array<number>): void {
    // Delete
    if (event.action === Multiaction.Delete) {
      this._plannerHttp.deleteEntriesBothTypes(appointmentIds, todosIds).then(
        async (data: any) => {
          this._getUpcomingPlans();
          this.closeMultiSelection();
        },
        async error => this._notificationService.showError('Ausgewählte Aufgaben und Termine konnten nicht gelöscht werden.')
      )
    } 

    // Update
    if (event.action === Multiaction.UpDate) {
      this._plannerHttp.upDateEntriesBothTypes(appointmentIds, todosIds, event.date).then(
        async (data: any) => {
          this._getUpcomingPlans();
          this.closeMultiSelection();
        }, 
        async error => this._notificationService.showError('Ausgewählte Aufgaben und Termine konnten nicht verschoben werden.')
      )
    }
  }

  /**
    * Add appointment to selected day
    * @param event id, name, date and time (optional)
    */
  private _addAppointment(event: Appointment): void {
    this._plannerHttp.addData<Appointment>(Tables.Appointments, event).then(
      async (data: Array<Appointment>) => {
        // Reload lists
        // this._getUpcomingPlans();

        // Reset editor
        this._editorBottom.resetEditorView();

        // Focus editor input
        this._editorBottom.focusEditorInput();
      }, 
      async error => this._notificationService.showError('Termin konnte nicht hinzugefügt werden.'),
    );
  }

  /**
   * Update selected appointment 
   * @param event id, name, date and time (optional)
   */
  private _updateAppointment(event: Appointment): void {
    this._plannerHttp.updateEntry(Tables.Appointments, event).then(
      async (data: Array<Appointment>) => {
        // Reload lists
        this._getUpcomingPlans();

        // Reset & close everything
        this.showEditor = false;
      }, 
      async error => this._notificationService.showError('Termin konnte nicht aktualisiert werden.'),
      );
  }

  /**
    * Delete selected appointment
    */
  private _deleteAppointment(item: Appointment): void {
    this._plannerHttp.deleteEntry(Tables.Appointments, item.id.toString()).then(
      async (data: Array<Appointment>) => null,
      async error => this._notificationService.showError('Termin konnte nicht gelöscht werden.'),
    )
  }

  /**
   * Multiaction for appointments
   * @param event of multiaction 
   * @param ids of appointments that should be upDated or deleted
   */
  private _multiAppointments(event: MultiActionEvent, ids: Array<number>): void {
    // Delete
    if (event.action === Multiaction.Delete) {
      this._plannerHttp.deleteEntries(Tables.Appointments, ids).then(
        async (data: Array<Appointment>) => {
          this._getUpcomingPlans();
          this.closeMultiSelection();
        },
        async error => this._notificationService.showError('Ausgewählte Termine konnten nicht gelöscht werden.'), 
      )
    }

    // UpDate
    if (event.action === Multiaction.UpDate) {
      this._plannerHttp.updateEntries(Tables.Appointments, ids, event.date).then(
        async (data: Array<Appointment>) => {
          this._getUpcomingPlans();
          this.closeMultiSelection();
        },
        async error => this._notificationService.showError('Ausgewählte Termine konnten nicht verschoben werden.'),
      )
    }
  }

  /**
   * Add todo to selected day
   * @param reqObj name, date and time (optional)
   */
  private _addTodo(event: Todo): void {
    const selectedDate = (new Date(event.date)).toLocaleDateString();
    const selectedDateList = (this.listDisplay.filter((elem) => elem.name === selectedDate))[0]?.value;
    
    // We do not set order to length of array + 1 because we have the option to delete items from the list
    // If todo list has no entry set order to 0 otherwise set the order + 1 of the todo with the highest order number
    if (selectedDateList?.length) {
      // Create deep copy of todo and sort by order to get the todo with the highest order number
      selectedDateList.sort((a, b) => {
        return a.order - b.order;
      });

      event.order = selectedDateList[selectedDateList.length - 1].order + 1; 
    } else {
      event.order = 0; 
    }

    this._plannerHttp.addData<Todo>(Tables.Todos, event).then(
      async (data: Array<Todo>) => {
        // Reload lists
        this._getUpcomingPlans();

        // Reset editor 
        this._editorBottom.resetEditorView();

        // Focus editor input
        this._editorBottom.focusEditorInput();
      }, 
      async error => this._notificationService.showError('Aufgabe konnte nicht hinzugefügt werden.'));
  }

  /**
   * Update selected todo 
   * @param event id, name, date and time (optional)
   */
  private _updateTodo(event: Todo): void {
    this._plannerHttp.updateEntry(Tables.Todos, event).then(
      async (data: Array<Todo>) => {
        // Reload list 
        this._getUpcomingPlans();

        // Reset & close everything
        this.showEditor = false;
      }, 
      async error => this._notificationService.showError('Aufgabe konnte nicht aktualisiert werden.'));
  }

  /**
   * Delete selected todo
   */
  private _deleteTodo(item: Todo): void {
    this._plannerHttp.deleteEntry(Tables.Todos, item.id.toString()).then(
      async (data: Array<Todo>) => this._getUpcomingPlans(),
      async error => this._notificationService.showError('Aufgabe konnte nicht gelöscht werden.'),
    )
  }

  /**
   * Multiaction for todos 
   * @param event of multiaction bar
   * @param ids of todos that should be upDated or deleted
   */
   private _multiTodos(event: MultiActionEvent, ids: Array<number>): void {
    // Delete
    if (event.action === Multiaction.Delete) {
      this._plannerHttp.deleteEntries(Tables.Todos, ids).then(
        async (data: Array<Todo>) => {
          this._getUpcomingPlans();
          this.closeMultiSelection();
        },
        async error => this._notificationService.showError('Ausgewählte Aufgaben konnten nicht gelöscht werden.'),
      )
    }

    // Update 
    if (event.action === Multiaction.UpDate) {
      this._plannerHttp.updateEntries(Tables.Todos, ids, event.date).then(
        async (data: Array<Todo>) => {
          this._getUpcomingPlans();
          this.closeMultiSelection();
        },
        async error => this._notificationService.showError('Ausgewählte Aufgaben konnten nicht verschoben werden.'),
      )
    }
  }

  /**
   * Format list - set or format  date, type and time
   */
  private _formatList(list: Array<Appointment | Todo>, entryType: number): Array<Appointment | Todo> {
    list.forEach((item: Appointment | Todo) => {
      item.type = entryType;
      item.date = item.date ? new Date(item.date) : null; 
      item.time = item.time ? this._dateService.formatTimeForDisplay(item.time) : null;
    }); 
    return list;
  }

  /**
   * Group list by date
   */
  private _groupByUpcomingList(list: Array<Appointment | Todo>): Array<DisplayListItem> {
    const groupedByList: Array<Appointment | Todo> = list.reduce((acc, value) => {
      // Format date display
      value.date_display = value.date ? (new Date(value.date)).toLocaleDateString() : 'Kein Datum';
      
      // Group initialization
      if (!acc[value.date_display]) {
        acc[value.date_display] = [];
      }
      
      // Grouping
      acc[value.date_display].push(value);

      return acc;
    }, []);
    
    return this._formatGroupByList(groupedByList); 
  }

  private _mergeLists(data: any): void {
    const [appointments, todos] = data;
        
    // Combine & merge lists 
    let formattedList = [...this._formatList(appointments, EntryType.Appointment), ...this._formatList(todos, EntryType.Todo)];

    // Set list for display and list that contains all entries
    this.listDisplay = this._listAll = this._groupByUpcomingList(formattedList);  
  }

  /**
   * Format grouped by date list
   */
  private _formatGroupByList(list: Array<Appointment | Todo>): Array<DisplayListItem> {
    const displayList: Array<DisplayListItem> = [];
    for (let item in list) {
      // Create object for every group and add it to displayList
      const displayObj: DisplayListItem = {};
      displayObj.name = item;
      displayObj.value = list[item];
      displayObj.date = list[item][0].date;
      displayObj.dayName = displayObj.date ? this._getDayName(displayObj.date) : null;
      displayObj.date ? displayList.push(displayObj) : displayList.unshift(displayObj);
     }

     displayList.sort(function(a,b){
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    return displayList;
  }

  /**
   * Get display date - today, tomorrow or day name
   */
  private _getDayName(date: string): string {
    const newDate: Date = new Date(date); 
    let displayString: string;
    if (!newDate) {
      displayString = 'Kein Datum';
    } else if (this._dateService.isToday(newDate)) {
      displayString = 'Heute';
    } else if (this._dateService.isTomorrow(newDate)) {
      displayString = 'Morgen';
    } else {
      displayString = `${this._dateService.dayName(newDate)}`;
    }
    return displayString;
  }
  
  /**
   * Get only ids of multiaction list
   * @param list 
   * @returns 
   */
  private _getMultiactionIds(list: Array<Appointment | Todo>): Array<number> {
    const ids: Array<number> = []; 
    list.forEach((item) => {
      ids.push(item.id);
    });
    return ids; 
  }

  /**
   * Listen to changes in todos database & reload list
   */
  private _changesNotifierTodos(): void {
    this._changesTodos$ = this._upcomingHttp.handleTodosChanged().on('*', todo => {
      const isSameDate = this._dateService.isSameDate(new Date(todo.new.date), this.selectedDate);
      // If collab & one has a day selected and other one has added new todo to the same day   
      // OR if user added new todo to own plan then reload to show entries in correct order
      if ((!todo.new.user_id && isSameDate) || todo.new.user_id === this._plannerHttp.supabase.auth.user().id) {
        this._getUpcomingPlans(this.tabIndex);
      }
    })
    .subscribe();  
  }

  /**
   * Listen to changes in appointments database & reload list
   */
  private _changesNotifierAppointments(): void {
    this._changesAppointments$ = this._upcomingHttp.handleAppointmentsChanged().on('*', appointment => {
      // If collab & one has a day selected and other one has added new todo to the same day
      if (this.tabIndex === AssignmentFilter.All && !appointment.new.user_id) {
        // Reload to show the first one the new added entry
        this._getUpcomingPlans(this.tabIndex);  
      }
    })
    .subscribe();  
  }
}
