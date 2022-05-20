import { Injectable } from '@angular/core';
import * as moment from 'moment-timezone';
import 'moment/min/locales';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  static readonly timezone = 'Europe/Berlin';

  constructor() { }

  /**
   * Get actual date without time
   */
  actualDate(): Date {
    const actualDate = new Date();
    actualDate.setHours(0, 0, 0, 0);
    return actualDate;
  }

  /**
   * Get actual time 
   * @returns string
   */
  actualTime(): string {
    const today = new Date();
    return today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
  }

  /**
   * Get name for day 
   * @param date of day
   */
  dayName(date: Date): string {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return days[date.getDay()]; 
  }

  getDayNameFromDate(date: string): string {
    const newDate: Date = new Date(date); 
    let displayString: string;
    if (!newDate) {
      displayString = 'Kein Datum';
    } else if (this.isToday(newDate)) {
      displayString = 'Heute';
    } else if (this.isTomorrow(newDate)) {
      displayString = 'Morgen';
    } else {
      displayString = `${this.dayName(newDate)}`;
    }
    return displayString;
  }

  /**
   * Get short name for day
   * @param date of day
   */
  dayNameShort(date: Date): string {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return days[date.getDay()]; 
  }

  /**
   * Check if date is actual date (today)
   * @param date object 
   */
  isToday(date: Date): boolean {
    date.setHours(0, 0, 0, 0);
    return date.valueOf() === this.actualDate().valueOf();
  }

  /**
   * Check if date is tomorrow
   * @param date object 
   */
  isTomorrow(date: Date): boolean {
    let today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today. getDate() + 1);

    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0); 
    tomorrow.setHours(0, 0, 0, 0); 
    
    return date.valueOf() === tomorrow.valueOf();
  }

  /**
   * Check if date is in this week
   * @param date object
   */
  isInThisWeek(date: Date): boolean {
    const now = moment();
    const input = moment(date);
    return (now.isoWeek() == input.isoWeek());
  }
 
  /**
   * Check if date is in next week
   * @param date object
   */
  isNextWeek(date: Date): boolean {
    const thisWeek = moment(date);
    const nextWeek = moment().add(1, 'weeks').startOf('isoWeek');
    return (thisWeek.isoWeek() == nextWeek.isoWeek());
  }

  /**
   * Check if date is in this month
   * @param date object
   */
  isInThisMonth(date: Date): boolean {
    return moment(date).isSame(new Date(), 'month');
  }

  /**
   * Check if date is in next month 
   * @param date object
   */
  isInNextMonth(date: Date): boolean {
    const nextMonth = moment().add(1, 'months');
    return moment(date).isSame(nextMonth, 'month');
  }

  /**
    * Check if date is in the past
    */
  isPast(date: Date): boolean {
    return date?.valueOf() < this.actualDate().valueOf();
  }

  isSameDate(date1: Date, date2: Date): boolean {
    date1?.setHours(0, 0, 0, 0);
    date2?.setHours(0, 0, 0, 0); 
    return date1?.valueOf() === date2.valueOf(); 
  }
  
  /**
   * Format date to timestamp with timezone
   */
  formatDateToTimestampTz(date: Date): string {
    return moment(date.toISOString()).utc().tz(DateService.timezone).format();
  }

  /**
   * Format date for display 
   * @param date object
   * @returns display string (example: 01.02.2021)
   */
  formatDateForDisplay(date: Date): string {
    return moment(date).locale('de').format('l');
  }

  /**
   * Format time for display 
   * @param time string 
   * @returns display time (example: 06:00)
   */
  formatTimeForDisplay(time: string): string {
    return moment(time, "HH:mm").format("HH:mm");
  }
}
