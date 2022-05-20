import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMealPlanComponent } from './list-meal-plan.component';

describe('ListMealPlanComponent', () => {
  let component: ListMealPlanComponent;
  let fixture: ComponentFixture<ListMealPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListMealPlanComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListMealPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
