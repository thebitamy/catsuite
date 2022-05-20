import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditorBottomComponent } from './editor-bottom.component';

describe('EditorBottomComponent', () => {
  let component: EditorBottomComponent;
  let fixture: ComponentFixture<EditorBottomComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditorBottomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditorBottomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
