import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { DatePickerHeaderComponent } from './datepicker/datepicker.component';
import { CalenderHeaderComponent } from './calendar-header/calendar-header.component';
import { EditorMultiactionComponent } from './editor-multiaction/editor-multiaction.component';
import { ListComponent } from './list/list.component';
import { MatMenuModule } from '@angular/material/menu';
import { ListMealPlanComponent } from './list-meal-plan/list-meal-plan.component';

@NgModule({
  declarations: [
    DatePickerHeaderComponent,
    CalenderHeaderComponent,
    EditorMultiactionComponent,
    ListComponent,
    ListMealPlanComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule,
    MatMenuModule,
  ], 
  exports: [
    DatePickerHeaderComponent,
    CalenderHeaderComponent,
    EditorMultiactionComponent,
    ListComponent,
    ListMealPlanComponent,
  ], 
  providers: [
    MatDatepickerModule,
  ]
})
export class SharedModule { }
