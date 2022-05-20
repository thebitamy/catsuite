import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CalenderHeaderComponent } from './calendar-header.component';

describe('CalenderHeaderComponent', () => {
  let component: CalenderHeaderComponent;
  let fixture: ComponentFixture<CalenderHeaderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CalenderHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalenderHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
