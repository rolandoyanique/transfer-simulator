import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferSimulationComponent } from './transfer-simulation.component';

describe('TransferSimulationComponent', () => {
  let component: TransferSimulationComponent;
  let fixture: ComponentFixture<TransferSimulationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransferSimulationComponent]
    });
    fixture = TestBed.createComponent(TransferSimulationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
