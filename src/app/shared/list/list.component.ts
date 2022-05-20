import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { EntryType } from '@core/enums/planner.enum';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent {
  static readonly SWIPE_LEFT = 2;
  static readonly SWIPE_RIGHT = 4;
  static readonly SWIPE_ACTION_WIDTH = 0.7;

  showMultiSelection: boolean;
  multiSelectionList: Array<any> = [];
  showAll = false;
  entryType = EntryType;
  selectedEntryIndex: number | null = null;
  displayList: Array<any> = [];
  localStorageListName: string;

  private _swipeDistance = 0;
  private _listElementWidth = 0;

  @Input() 
  set list(value: Array<any>) {
    this.displayList = value; 
    this.panWidth = 0; 
    this.selectedEntryIndex = null;
    setTimeout(() => {this._listElementWidth = this._listContainer?.nativeElement?.clientWidth});
    this.showMultiSelection = false;
    this.multiSelectionList = [];
  }  
  
  @Input() 
  set localStorageName(value: string) {
    if (value) {
      this.localStorageListName = value;
      this._getShowAll();
    }
  }

  @Input() headline: string;
  @Input() headlineDayName: string;
  @Input() listType: number;
  @Input() actionType: number;
  @Input() sort: boolean = true;
  @Input() externMultiAction: boolean = false;

  @Output() changedOrder = new EventEmitter<Array<any>>();
  @Output() swipedItem = new EventEmitter<Array<any>>();
  @Output() checkedItem = new EventEmitter<Array<any>>();
  @Output() openItem = new EventEmitter<Array<any>>();
  @Output() multiaction = new EventEmitter<Array<any>>();

  @ViewChild('listContainer') private _listContainer: ElementRef; 
  @ViewChildren('checkbox') private _checkbox: QueryList<ElementRef>; 

  /**
   * Get headline display string
   */
  get headlineDisplay(): string {
    return this.showMultiSelection && !this.externMultiAction ? `${this.headline} auswählen (${this.multiSelectionList.length})` : this.headline;
  }

  /** 
  * Get width of the swipe distance
  */
  get panWidth(): number {
    return this._swipeDistance;
  }

  /**
   * Set width of the swipe distance
   */
  set panWidth(value: number) {
    this._swipeDistance = value;
  }

  /**
   * Disable "unfold less" icon when 
   */
  get showAllDisabled(): boolean {
    return this.displayList.every((item) => item?.done === false || item?.past === false); 
  }

  /**
   * Drop list item and change order 
   */
  dropListItem(event: CdkDragDrop<string[]>): void {
    console.log(event)
    // Get elements 
    const prevTodo = this.displayList[event.previousIndex];
    const currTodo = this.displayList[event.currentIndex];

    // CDK drag and drop function 
    moveItemInArray(this.displayList, event.previousIndex, event.currentIndex);

    // Undone drag and drop and return if condition is true  
    if (prevTodo.time && !currTodo.time || !prevTodo.time && currTodo.time || prevTodo.done || prevTodo.time && currTodo.time) {
      setTimeout(() => moveItemInArray(this.displayList, event.currentIndex, event.previousIndex), 200);
      return;
    }

    // Requests for changing todo list order 
    this.changedOrder.emit(this.displayList);
  }

  /**
   * Close multi selection for list
   */
  closeMultiSelection(): void {
    this.showMultiSelection = false;
    this.multiSelectionList = [];

    this._getShowAll();

    // Set selected property to reset highlight for list item 
    this.displayList?.forEach((item) => {
      item.selected = false;
    });
  }

  /**
   * Set localstorage showAllTodos value to show or hide done todos
   * @return if all appointments are expired or there is no appointment)
   */
  setShowTodoAll(): void {
    if (this.showAllDisabled) {
      return;
    }

    this.showAll = !this.showAll;
    localStorage.setItem(this.localStorageListName, this.showAll.toString());
  }

  /**
   * Show delete action
   * @param event of hammer js 
   * @param index selected item of array
   */
  showSwipeAction(event:any, index: number): void {
    // Only when swipe horizontal 
    if (event.direction !== ListComponent.SWIPE_LEFT && event.direction !== ListComponent.SWIPE_RIGHT || this.showMultiSelection) {
      this.panWidth = 0; 
      return; 
    }

    if (event.distance > (this._listElementWidth * ListComponent.SWIPE_ACTION_WIDTH) && event.direction === ListComponent.SWIPE_LEFT) {
      // If swipe 70 percent of entry set delete action ui element to full width
      this.panWidth = this._listElementWidth;
    } else if (event.distance < (this._listElementWidth * ListComponent.SWIPE_ACTION_WIDTH) && (event.direction === ListComponent.SWIPE_LEFT || (event.direction === ListComponent.SWIPE_RIGHT && this.panWidth > 0))) {
      // Set delete action ui element to swipe width
      this.panWidth = event.distance;
    }

    // Set index to adjust the width of delete action
    this.selectedEntryIndex = index;
  }

  /**
   * Delete entry
   * @param event of hammer js 
   * @param index of selected item of array
   * @param table to identify which item of array should be deleted
   */
  swipeAction(event: any, index: number): void {
    // Only when swipe horizontal (direction 1 is also left)
    if ((event.direction !== ListComponent.SWIPE_LEFT && event.direction !== ListComponent.SWIPE_RIGHT && event.direction !== 1) || this.showMultiSelection) {
      return; 
    }

    // When swipe/pan to < 70 percent then hide delete action 
    if (event.distance < (this._listElementWidth * ListComponent.SWIPE_ACTION_WIDTH)) {
      this.panWidth = 0;
      this.selectedEntryIndex = null;
    } else {
      this.swipedItem.emit(this.displayList[index]);  
    }
  }

  /**
   * Check if element should be mark as done, edited or selected (multiselection) after element is clicked
   * @param event click 
   * @param index of clicked Array element 
   */
  elementClicked(event: Event, index: number): void {
    // Prevent event triggers twice
    event.preventDefault();

    // Check if clicked inside checkbox 
    if (this._checkbox.find((elem) => elem.nativeElement.contains(event.target))) {
      this._markTodo(index);
      return; 
    }

    if (this.showMultiSelection) {
        this._selectEntry(index);
    } else {
      // If multislection is activated open editor with the selected values 
      this.openItem.emit(this.displayList[index]);
    }
  }
  
  /**
   * Open multi selection for selected list
   */
  openMultiSelection(): void {
    this.showMultiSelection = true;
    this.showAll = true; 
  }

  onMultiaction(event: any): void {
    const data = {...event, ...{list: this.multiSelectionList}};
    this.multiaction.emit(data);  
  }

  /**
   * Set localstorage showAllTodos value to show or hide expired appointments
   * @return if all appointments are expired or there is no appointment)
   */
  setShowAll(): void {
    if (this.showAllDisabled) {
      return;
    }

    this.showAll = !this.showAll;
    localStorage.setItem(this.localStorageListName, this.showAll.toString());
  }

  /**
    * Get localstorage value and set showAllTodos to show or hide unnecessary items 
    */
  private _getShowAll(): void {
    this.showAll = localStorage.getItem(this.localStorageListName) === 'true';
  }

  /**
    * Mark selected todo item as done / undone
    * @param index of array 
    */
  private _markTodo(index: number): void {
    // Get todo and mark as done or undone
    const item = this.displayList[index];
    item.done = !item.done;
    item.id.toString();
    this.checkedItem.emit(item);
  }

  /**
   * Select entry (multiselection)
   * @param index of clicked Array element
   */
  private _selectEntry(index: number): void {
    // Check if element is already selected - add or remove it 
    const selectedEntry = this.multiSelectionList.filter((elem) => elem.id === this.displayList[index].id);
    if (selectedEntry?.length) {
      const idx = this.multiSelectionList.indexOf(this.displayList[index].id);
      this.multiSelectionList.splice(idx, 1);
      this.displayList[index].selected = false;
    } else {
      this.multiSelectionList.push(this.externMultiAction ? this.displayList[index] : this.displayList[index].id);
      this.displayList[index].selected = true;
    }
  }
}
