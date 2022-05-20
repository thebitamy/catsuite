import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss']
})
export class RecipesComponent implements OnInit {

  constructor(
    private router: Router,
  ) { }

  ngOnInit(): void {
  }

  navigateToGrocery(): void {
    this.router.navigateByUrl('/grocery-list');
  }
}
