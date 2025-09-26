import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferHistoryComponent } from './transfer-history.component';

describe('TransferHistoryComponent', () => {
  let component: TransferHistoryComponent;
  let fixture: ComponentFixture<TransferHistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransferHistoryComponent]
    });
    fixture = TestBed.createComponent(TransferHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
