import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DateService } from './services/date/date.service';
import { NotificationService } from './services/notification/notification.service';

@NgModule({
  imports: [
    CommonModule,
  ],
  providers: [
    DateService, 
    NotificationService,
  ], 
})
export class CoreModule { }
