import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { NotificationService } from '@core/services/notification/notification.service';
import { AuthService } from '@core/http/authentication/authentication';
import { ViewType } from '@core/enums/login.enum';
import { LoginData } from '@core/models/login.interface';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  showPw: boolean;
  submitted: boolean;
  actionSuccess = false;

  view = ViewType.Login;
  viewType = ViewType;  
  
  // Validators are set in the method setFormValidators
  form: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl(''),
    password_confirm: new FormControl(''),
  });

  constructor(
    private _authHttp: AuthService,
    private _router: Router,
    private _notificationService: NotificationService, 
  ) { }

  ngOnInit(): void {
    this._formValueWatcher();
    this._setFormValidators(this.view);
  }

  /**
   * Reset form and change form for other 'view' 
   * @param type of form
   */
  changeForm(type: number): void {
    this.view = type;
    this.form.reset();
    this._setFormValidators(type);
  }

  /**
   * Reset view and change view to login view 
   */
  resetAndBackToLogin(): void {
    this.view = ViewType.Login; 
    this.actionSuccess = false;
    this.form.reset(); 
    this._setFormValidators(this.view);
  }

  /**
   * Check which method should be called for each form
   */
  submitForm(): void {
    // Sets submitted to true for error styling 
    this.submitted = true;

    // Validate form
    if (this.form.invalid) {
      return;
    }

    switch (this.view) {
      case ViewType.SignUp:
        this._signUp();
        break;
      case ViewType.ResetPw: 
        this._resetPw();
        break;
      default:
        this._login();
    }
  }

  /**
   * Login request
   */ 
  private _login(): void  {
    this._authHttp.signIn(this._getFormattedData()).then(
      async data => this._router.navigateByUrl('/planner'), 
      async error => this._notificationService.showError('Ein unbekannter Fehler ist eingetreten.'),
    );
  }

  /**
   * Sign up request
   */
  private _signUp(): void {
    // Set error if passwords don't match & return
    const rawForm = this.form.getRawValue();
    if (rawForm.password !== rawForm.password_confirm) {
      this._setPwErrors(true);
      return;
    }

    this._authHttp.signUp(this._getFormattedData()).then(
      async data => {
        this.actionSuccess = true;
      }, 
      async error => this._notificationService.showError('Ein unbekannter Fehler ist eingetreten.'),
    );
  }

  /**
   * Reset password
   */
  private _resetPw(): void {
    this._authHttp.resetPw(this._getFormattedData()).then(
      async data => {
        this.actionSuccess = true;
      }, 
      async error => this._notificationService.showError('Passwort konnte nicht zurückgesetzt werden.'),
    );
  }

  /**
   * Change form and add/remove validators 
   * @param type for setting validator to specific field 
   */
  private _setFormValidators(type: number): void {
    const control = this.form.get('password_confirm'); 
    if (type === ViewType.SignUp) {
      control.setValidators(Validators.required);
    } else {
      control.clearAsyncValidators();
    }
    control .updateValueAndValidity();
  }
    
  /**
   * Observe form changes
   */
  private _formValueWatcher(): void {
    this.form.valueChanges.subscribe(() => {
      // Sets submitted to false to hide input error styling until user submits form again
      this.submitted = false;

      // Reset errors for password confirm in sign up form
      if (this.view === this.viewType.SignUp) {
        this._setPwErrors(null);
      }
    });
  }
  
  /**
   * Set form passwords errors
   * @param value: true to set errors and null to reset errors 
   */
  private _setPwErrors(value: true | null): void {
    this.form.get('password').setErrors(value ? {'incorrect': value} : null);
    this.form.get('password_confirm').setErrors(value ? {'incorrect': value} : null);
  }

  /**
   * Removes properties from data object that has no value
   * @returns formatted request data
   */
  private _getFormattedData(): LoginData {
    const values = this.form.getRawValue();
    const dataObj: any = {};
    for (let value in values) {
      if (values[value]) {
        dataObj[value] =  values[value];
      }
    }
    return dataObj;
  }
}
