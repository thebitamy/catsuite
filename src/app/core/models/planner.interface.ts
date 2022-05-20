export interface DayPlan {
    appoinments: Array<Appointment>;
    meal_plan: MealPlan;
    todos: Array<Todo>;
}

export interface MealPlan{
    id: number;
    lunch: Meal;
    dinner: Meal;
    date: string;
    dayName?: string;
}

export interface Meal {
    id: number; 
    name: string; 
    duration?: number;
    costs?: number;
}

export interface Appointment {
    id?: any;
    name: string;
    date?: string | Date;
    time?: string; 
    notes?: string;
    order?: number;
    past?: boolean;
    selected?: boolean;
    type?: number; 
    date_display?: string;
}

export interface Todo {
    id?: any;
    name: string;
    date?: string | Date;
    time?: string; 
    done?: boolean;
    order?: number; 
    selected?: boolean;
    type?: number;
    date_display?: string;
}

export interface MultiActionEvent {
    action: number;
    date: Date;
    list: Array<any>;
}