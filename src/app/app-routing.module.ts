import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ActivitiesComponent } from 'src/app/modules/pages/activities/activities.component';
import { ErrorComponent } from 'src/app/modules/pages/error/error.component';
import { RecipesComponent } from 'src/app/modules/pages/recipes/recipes.component';
import { HomeComponent } from 'src/app/modules/pages/home/home.component';
import { LoginComponent } from 'src/app/modules/pages/login/login.component';
import { PetsComponent } from 'src/app/modules/pages/pets/pets.component';
import { PlannerComponent } from 'src/app/modules/pages/planner/planner.component';
import { UpcomingComponent } from 'src/app/modules/pages/upcoming/upcoming.component';
import { GroceryListComponent } from 'src/app/modules/pages/grocery-list/grocery-list.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'planner', component: PlannerComponent },
  { path: 'home', component: HomeComponent },
  { path: 'recipes', component: RecipesComponent },
  { path: 'grocery-list', component: GroceryListComponent },
  { path: 'pets', component: PetsComponent },
  { path: 'activities', component: ActivitiesComponent },
  { path: 'upcoming', component: UpcomingComponent },
  { path: '**', component: ErrorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
