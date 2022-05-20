import { BrowserModule, HammerModule, HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { NgModule, Injectable } from '@angular/core';
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

import { ModulesModule } from './modules/modules.module';
import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';

@Injectable({
  providedIn: 'root',
})
export class MyHammerConfig extends HammerGestureConfig  {
  // overrides = <any>{
  //   'swipe': {velocity: 0.1, threshold: 5}, // override default settings
  //   'press': {velocity: 0.1, threshold: 5} // override default settings
  // }
}

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ModulesModule,
    SharedModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    BrowserAnimationsModule,
    MatIconModule,
    MatToolbarModule,
    HammerModule,
    CoreModule,
  ],
  // providers: [{ 
  //   provide: HAMMER_GESTURE_CONFIG, 
  //   useClass: MyHammerConfig 
  // }],
  bootstrap: [AppComponent]
})
export class AppModule { }
