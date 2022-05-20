import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditorMultiactionComponent } from './editor-multiaction.component';

describe('EditorMultiactionComponent', () => {
  let component: EditorMultiactionComponent;
  let fixture: ComponentFixture<EditorMultiactionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditorMultiactionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditorMultiactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
