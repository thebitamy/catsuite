import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';

import { SharedModule } from '@shared/shared.module';
import { DateService } from '@core/services/date/date.service';
import { LoginComponent } from 'src/app/modules/pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { PlannerComponent } from './pages/planner/planner.component';
import { RecipesComponent } from './pages/recipes/recipes.component';
import { PetsComponent } from './pages/pets/pets.component';
import { ActivitiesComponent } from './pages/activities/activities.component';
import { ErrorComponent } from './pages/error/error.component';
import { EditorBottomComponent } from './components/editor-bottom/editor-bottom.component';
import { UpcomingComponent } from 'src/app/modules/pages/upcoming/upcoming.component';
import { MatTabsModule } from '@angular/material/tabs';
import { GroceryListComponent } from './pages/grocery-list/grocery-list.component';


@NgModule({
  declarations: [
    LoginComponent,
    HomeComponent,
    PlannerComponent,
    RecipesComponent,
    PetsComponent,
    ActivitiesComponent,
    ErrorComponent,
    EditorBottomComponent, 
    UpcomingComponent, 
    GroceryListComponent, 
  ],
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    NgxMaterialTimepickerModule.setLocale('de-DE'),
    MatIconModule,
    MatDatepickerModule,
    MatRadioModule,
    MatSelectModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTabsModule,
    SharedModule,
  ],
  providers: [
    DateService,
  ]
})
export class ModulesModule { }
