import { TestBed } from '@angular/core/testing';

import { CsvParser } from './csv-parser';

describe('CsvParser', () => {
  let service: CsvParser;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvParser);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
