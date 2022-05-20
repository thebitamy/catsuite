import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PlannerComponent } from './planner.component';

describe('PlannerComponent', () => {
  let component: PlannerComponent;
  let fixture: ComponentFixture<PlannerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PlannerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
