import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefreshAccountsComponent } from './refresh-accounts.component';

describe('RefreshAccountsComponent', () => {
  let component: RefreshAccountsComponent;
  let fixture: ComponentFixture<RefreshAccountsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RefreshAccountsComponent]
    });
    fixture = TestBed.createComponent(RefreshAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
