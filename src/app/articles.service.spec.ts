import { TestBed } from '@angular/core/testing';

import { ArticlesStorService } from './articles-store.service';

describe('ArticlesService', () => {
  let service: ArticlesStorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArticlesStorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
