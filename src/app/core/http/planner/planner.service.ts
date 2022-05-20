import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '@core/http/authentication/authentication';
import { DateService } from '@core/services/date/date.service';
import { Tables } from '@core/enums/http-tables.enum';
import { Appointment, MealPlan, Todo } from '@core/models/planner.interface';
import { Observable } from 'rxjs';
import { SupabaseQueryBuilder } from '@supabase/supabase-js/dist/main/lib/SupabaseQueryBuilder';

@Injectable({
  providedIn: 'root'
})
export class PlannerService extends AuthService {
  constructor(
    public router: Router,
    private _dateService: DateService,
  ) {
    super(router);
  }

  /**
   * Add entry to planner to database
   * @param table name in database
   * @param entry appointment or todo
   */
  async addData<T>(table: string, entry: Appointment | Todo): Promise<Array<Appointment | Todo>> {
    return new Promise(async (resolve, reject) => {
      const {error, data} = await this.supabase.from(table).insert(entry);
      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Update entry in database
   * @param table name in database
   * @param entry appointment or todo 
   */
  async updateEntry(table: string, entry: Appointment | Todo): Promise<Array<Appointment | Todo>> {
    return new Promise(async (resolve, reject) => {
      const id: string = entry.id.toString();
      delete entry.id;
      const {error, data} = await this.supabase.from(table).update(entry).match({id});

      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Update date of multiple selected entries
   * @param table name in database
   * @param list of appointments or todos
   * @param date udpated value
   */
  async updateEntries<T>(table: string, idList: Array<number>, date: Date): Promise<Array<T>> {
    const formattedDate = this._dateService.formatDateToTimestampTz(date);
    return new Promise(async (resolve, reject) => {
      const {error, data} =  await this.supabase.from(table).update({date: formattedDate}).in('id', idList);

      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Update date of multiple selected entries of both types (appointment, todo)
   * @param appointmentsIds list of appointment ids
   * @param todosIds list of todo ids
   * @param date to update
   */
  async upDateEntriesBothTypes(appointmentsIds: Array<number>, todosIds: Array<number>, date: Date): Promise<Array<any>> {
    const promises = [
      this.updateEntries(Tables.Appointments, appointmentsIds, date),
      this.updateEntries(Tables.Todos, todosIds, date),
    ];
    return await Promise.all(promises);
  }

  /** 
   * Delete selected entry
   * @param table name in database
   * @param id of selected entry 
   */
  async deleteEntry(table: string, id: string): Promise<Array<Appointment | Todo>> {
    return new Promise(async (resolve, reject) => {
      const {error, data} =  await this.supabase.from(table).delete().match({id})

      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Delete multiple selected entries
   * @param table name in database
   * @param list of appointments or todos
   */
  async deleteEntries(table: string, list: Array<string | number>): Promise<Array<Appointment | Todo>> {
    return new Promise(async (resolve, reject) => {
      const {error, data} =  await this.supabase.from(table).delete({returning: 'representation'}).in('id', list);

      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Delete multiple selected entries of both types (appointment, todo)
   * @param appointmentsIds list of appointment ids
   * @param todosIds list of todo ids
   */
  async deleteEntriesBothTypes(appointmentsIds: Array<number>, todosIds: Array<number>): Promise<Array<any>> {
    const promises = [
      this.deleteEntries(Tables.Appointments, appointmentsIds),
      this.deleteEntries(Tables.Todos, todosIds),
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
      const {error, data} = await this.supabase.from(Tables.MealPlan).select('lunch(*), dinner(*), date').eq('date', formattedDate).order('id', { ascending: true });
      
      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }
  
  /**
   * Get appointments for selected date
   */
  async getAppointments(date: Date): Promise<Array<Appointment>> {
    const formattedDate = this._dateService.formatDateToTimestampTz(date);
    return new Promise(async (resolve, reject) => {
      const {error, data} = await this.supabase.from(Tables.Appointments).select('*').eq('date', formattedDate).order('time', { ascending: true });
      
      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Get todos for selected date
   */
  async getTodos(date: Date): Promise<Array<Todo>> {
    const formattedDate = this._dateService.formatDateToTimestampTz(date);
    return new Promise(async (resolve, reject) => {
      const {error, data} = await this.supabase.from(Tables.Todos).select('*').eq('date', formattedDate).or((`user_id.is.null, user_id.eq.${this.supabase.auth.user().id.toString()}`)).order('done', {ascending: true}).order('time', {ascending: true}).order('order', {ascending: true});
      
      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Mark todo as done or undone
   * @param id of selected todo
   * @param done updated value
   */
  async markTodo(id: string, done: boolean): Promise<Array<Todo>> {
    return new Promise(async (resolve, reject) => {
      const {error, data} = await this.supabase.from(Tables.Todos).update({done}).match({id});

      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Change order of all todos
   * @param order number of todo 
   * @param id of todo
   */
  async changeTodosOrder(order: number, id: string): Promise<Array<Todo>> {
    return new Promise(async (resolve, reject) => {

      const {error, data} = await this.supabase.from(Tables.Todos).update({order}).match({id});

      // Throw error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Listen to the changes of todos database
   */ 
  handleTodosChanged(): SupabaseQueryBuilder<any> {
    return this.supabase.from(Tables.Todos);
  }  

  /**
   * Listen to the changes of appointments database
   */ 
  handleAppointmentsChanged(): SupabaseQueryBuilder<any> {
    return this.supabase.from(Tables.Appointments);
  }

  /**
   * Listen to the changes of appointments database
   */ 
  handleMealPlanChanged(): SupabaseQueryBuilder<any> {
    return this.supabase.from(Tables.MealPlan);
  }

  // get dayplan (): Observable<DayPlan> {
  //   return this._plan.asObservable();
  // }
  // 
  // async getMealPlan(): Promise<void> {
    // Get day plans --> TODO for specific day
    // const tables = ['todos', 'appointments', 'meal_plan'];
    // const promises = {};
    // await Promise.all(tables.map(async (table) => {
    //   if (table === 'meal_plan') {
    //     promises[table] = (await this.supabase.from('meal_plan').select(`lunch(*), dinner(*), date`).eq('date', '2021-06-04T00:00:00+00:00')).data[0];
    //   } else {
    //     promises[table] = (await this.supabase.from(table).select('*').eq('date', '2021-06-04')).data;
    //   }
    // }));

    // const data =(await this.supabase.from('meal_plan').select('*').eq('date', '2021-06-04')).data;

    // this._plan.next(promises);
  // }

  // async getDishes() {
  //   // Get list of all dishes
  //   const query2 = await this.supabase.from('dishes').select('*'); 

  //   // Get ingredients and amount of them for a selected dish --> filter by dish dynamic
  //   const query = await this.supabase.from('ingredients')
  //   .select('*').eq('dish_id', 1)
  //   .select(`
  //   amount,
  //   food (
  //     *
  //   )`);

  //   // Get recipes incl. all steps for selected dish
  //   const query1 = await this.supabase.from('recipe').select('*').eq('dish_id', 1);

  //   // Get meal plan of specific day --> TODO for specific day
  //   const query3 = await this.supabase.from('meal_plan').select(`lunch(*), dinner(*), date`).eq('date', '2021-06-04T00:00:00+00:00');
  //   // console.log(query3.data);

  //   // Select dish form meal_plan (make dynamic)
  //   const query4 = await this.supabase.from('recipe').select('*').eq('dish_id', 1);

  //   // Shopping list 


  //   this._dishes.next(query.data); 
  // }

  // async addDish(dish) {
  //   const newDish = {
  //     user_id: this.supabase.auth.user().id,
  //     dish
  //   };

  //   // You could check for error, minlength of task is 3 chars!
  //   const result = await this.supabase.from(this.DISHES_DB).insert(newDish);
  // }

  // async removeDish(id) {
  //   await this.supabase
  //     .from(this.DISHES_DB)
  //     .delete()
  //     .match({id})
  // }

  // async updateDish(id, property) {
  //   await this.supabase
  //     .from(this.DISHES_DB)
  //     .update({property})
  //     .match({id})
  // }

}
