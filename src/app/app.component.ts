import { Component} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { PlannerService } from '@core/http/planner/planner.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(
    private _plannerHttp: PlannerService,
    public router: Router
  ) {
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this._plannerHttp.authStateChange();
      }
    });
  }

}
