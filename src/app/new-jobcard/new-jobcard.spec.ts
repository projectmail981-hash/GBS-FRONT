import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewJobcard } from './new-jobcard';

describe('NewJobcard', () => {
  let component: NewJobcard;
  let fixture: ComponentFixture<NewJobcard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewJobcard],
    }).compileComponents();

    fixture = TestBed.createComponent(NewJobcard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
