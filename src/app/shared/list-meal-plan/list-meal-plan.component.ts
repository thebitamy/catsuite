import { Component, Input, OnInit } from '@angular/core';
import { MealPlan } from '@core/models/planner.interface';
import { DateService } from '@core/services/date/date.service';

@Component({
  selector: 'app-list-meal-plan',
  templateUrl: './list-meal-plan.component.html',
  styleUrls: ['./list-meal-plan.component.scss']
})
export class ListMealPlanComponent implements OnInit {
  displayList: Array<MealPlan>;

  @Input()
  set list(value: Array<MealPlan>) {
    this._formatList(value);
  }
  
  constructor(
    private _dateService: DateService,
  ) { }

  ngOnInit(): void {
  }

  private _formatList(list: Array<MealPlan>) {
    list?.forEach((day) => {
      day.dayName = this._dateService.getDayNameFromDate(day.date);
      day.date = this._dateService.formatDateForDisplay(new Date(day.date));
    });
    this.displayList = list;
  }
}
