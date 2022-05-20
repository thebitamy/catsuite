import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';

import { LoginData } from '../../models/login.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // TODO: Typisierung

  supabase: SupabaseClient;
  supabaseUrl = "https://uplpzfohtteahtkebceq.supabase.co";
  supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNDMzMzk4MywiZXhwIjoxOTI5OTA5OTgzfQ.np8DFEaDH5lHdZ9vISCgbfAfdUFGwwK_Id6zA04-0Sk";
 
  private _currentClient: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor(public router: Router) {
    // Create client 
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
      autoRefreshToken: true,
      persistSession: true,
    }); 

    this.authStateChange();
  }

  authStateChange(): void {
      // Subscribe to state change
      this.supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
          this._currentClient.next(session.user);
  
          this.router.events.subscribe((val) => {
            if (val instanceof NavigationEnd) {
              if (val.urlAfterRedirects === '/') {
                this.router.navigateByUrl('/planner'); 
              }
            }
          }); 
        } else {
          this._currentClient.next(false);
        }
      })
  }

  /**
   * Sign user up with credentials
   */
  async signUp(credentials: LoginData): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const {error, data} = await this.supabase.auth.signUp(credentials);

      // Catch error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Sign user in with credentials
   */
  async signIn(credentials: LoginData): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const {error, data} = await this.supabase.auth.signIn(credentials);

      // Catch error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Sign user out and navigate to login 
   */
  async signOut(): Promise<any> {
    await this.supabase.auth.signOut();

    this.supabase.getSubscriptions().map(sub => {
      this.supabase.removeSubscription(sub); 
    }); 

    this.router.navigateByUrl('/login'); 
  }

  /**
   * Reset user's password
   */
  async resetPw(credentials: LoginData): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const {error, data} = await this.supabase.auth.api.resetPasswordForEmail(credentials.email);
      
      // Catch error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }

  /**
   * Update users date - email or password
   */
  async updateUser(user: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const {error, data} = await this.supabase.auth.update(user);

      // Catch error or resolve data
      if (error) {
        reject(error); 
      } else {
        resolve(data);
      }
    })
  }
}
