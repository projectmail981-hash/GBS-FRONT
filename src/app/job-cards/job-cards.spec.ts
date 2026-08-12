import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobCards } from './job-cards';

describe('JobCards', () => {
  let component: JobCards;
  let fixture: ComponentFixture<JobCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobCards],
    }).compileComponents();

    fixture = TestBed.createComponent(JobCards);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
