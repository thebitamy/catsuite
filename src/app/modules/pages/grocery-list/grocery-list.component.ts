import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-grocery-list',
  templateUrl: './grocery-list.component.html',
  styleUrls: ['./grocery-list.component.scss']
})
export class GroceryListComponent implements OnInit {

  constructor(
    private router: Router, 
  ) { }

  ngOnInit(): void {
  }

  navigateToRecipes(): void {
    this.router.navigateByUrl('/recipes');
  }

}
