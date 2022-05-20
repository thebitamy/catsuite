import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Tables } from '@core/enums/http-tables.enum';
import { AssignmentFilter } from '@core/enums/upcoming.enum';
import { AuthService } from '@core/http/authentication/authentication';
import { Appointment, MealPlan, Todo } from '@core/models/planner.interface';
import { DateService } from '@core/services/date/date.service';
import { SupabaseQueryBuilder } from '@supabase/supabase-js/dist/main/lib/SupabaseQueryBuilder';

@Injectable({
  providedIn: 'root'
})
export class UpcomingService extends AuthService {

  constructor(
    public router: Router,
    private _dateService: DateService,
  ) {
    super(router);
  }

  /**
   * Search in all entries (appointments and todos)
   * @param text to search for 
   */
  async searchEntries(text: string, date: Date, assignment: number): Promise<any> {
    const formattedDate = this._dateService.formatDateToTimestampTz(date);
    const promises = [
      this._searchAppointments(text, formattedDate, assignment),
      this._searchTodos(text, formattedDate, assignment),
    ];
    return await Promise.all(promises);
  }

  /**
   * Get upcoming plans
   * @param date - actual date
   */
  async getUpcomingPlans(date: Date, assignment?: number): Promise<any> {
    const formattedDate = this._dateService.formatDateToTimestampTz(date);
    const promises = [
      this._getUpcomingAppointments(formattedDate, assignment),
      this._getUpcomingTodos(formattedDate, assignment),
    ];
    return await Promise.all(promises);
  }

  /**
   * Get meal plan for selected date 
   * @param date with timezone will be formatted to iso string
   */
  async getMealPlan(date: Date): Promise<Array<MealPlan>> {
    const formattedDate = this._dateService.formatDateToTimestampTz(date);
    return new Promise(async (resolve, reject) => {
      const {error, data} = await this.supabase.from(Tables.MealPlan)
      .select('lunch(*), dinner(*), date')
      .or(this._formatDates(formattedDate))
      .order('date', { ascending: true });
      
      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }
  
  /**
   * Listen to the changes of appointments database
   */ 
  handleAppointmentsChanged(): SupabaseQueryBuilder<any> {
    return this.supabase.from(Tables.Appointments);
  }

  /**
   * Listen to the changes of todos database
   */ 
  handleTodosChanged(): SupabaseQueryBuilder<any> {
    return this.supabase.from(Tables.Todos);
  }  

  /**
   * Get upcoming appointments
   * @param date - actual date
   */
  private async _getUpcomingAppointments(date: string, assignment: number): Promise<Array<Appointment>> {
    return new Promise(async (resolve, reject) => {
      const {error, data} = await this.supabase.from(Tables.Appointments)
        .select('*')
        .or(this._formatDates(date))
        .or(this._formatAssignmentType(assignment))
        .order('date', {ascending: true})
        .order('time', {ascending: true});
      
      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Get upcoming todos 
   * @param date - actual date
   */
  private async _getUpcomingTodos(date: string, assignment: number): Promise<Array<Todo>> {
    return new Promise(async (resolve, reject) => {
      const {error, data} = await this.supabase.from(Tables.Todos)
        .select('*')
        .or(this._formatDates(date))
        .or(this._formatAssignmentType(assignment))
        .order('date', {ascending: true})
        .order('time', {ascending: true})
        .order('done', {ascending: true})
        .order('order', {ascending: true});
      
      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Search upcoming appointments
   * @param date - actual date
   */
  private async _searchAppointments(text: string, date: string, assignment: number): Promise<Array<Appointment>> {
    return new Promise(async (resolve, reject) => {
      const {error, data} = await this.supabase.from(Tables.Appointments)
        .select('*')
        .or(this._formatDates(date))
        .or(this._formatAssignmentType(assignment))
        .ilike('name', this._formatSearchText(text))
        .order('date', {ascending: true})
        .order('time', {ascending: true});
      
      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Search upcoming todos 
   * @param date - actual date
   */
  private async _searchTodos(text: string, date: string, assignment: number): Promise<Array<Todo>> {
    return new Promise(async (resolve, reject) => {
      const {error, data} = await this.supabase.from(Tables.Todos)
        .select('*')
        .or(this._formatDates(date))
        .or(this._formatAssignmentType(assignment))
        .ilike('name', this._formatSearchText(text))
        .order('date', {ascending: true})
        .order('time', {ascending: true})
        .order('done', {ascending: true})
        .order('order', {ascending: true});
      
      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Format assignment type to string for request 
   */
  private _formatAssignmentType(assignment?: number): string {
    if (!assignment) {
      return `user_id.is.null, user_id.eq.${this.supabase.auth.user().id.toString()}`;
    }

    if (assignment === AssignmentFilter.Me) {
      return `user_id.eq.${this.supabase.auth.user().id.toString()}`;
    }

    if (assignment === AssignmentFilter.Both) {
      return 'user_id.is.null';
    }
  }

  /**
   * Format date for request 
   * Get entries with no date and date newer than today or today 
   */
  private _formatDates(date: string): string {
    return `date.is.null, date.gte.${date}`; 
  }

  /**
   * Format text string for request
   */
  private _formatSearchText(text: string): string {
    return `%${text}%`;
  }
}
