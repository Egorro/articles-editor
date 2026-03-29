import { inject, Injectable } from '@angular/core';
import { ArticlesApiService } from './articles-api.service';
import { BehaviorSubject, combineLatest, filter, map, startWith, Subject, switchMap } from 'rxjs';
import { Article, Segment } from './models/article.model';

@Injectable({
  providedIn: 'root',
})
export class ArticlesStorService {
  private readonly articleService = inject(ArticlesApiService);
  private readonly currentIdSub = new BehaviorSubject<number | null>(null);
  private readonly refreshArticlesSub = new Subject<void>();
  private readonly refresh$ = this.refreshArticlesSub.pipe(startWith(null));

  private readonly currentId$ = this.currentIdSub.asObservable();
  readonly articles$ = this.refresh$.pipe(switchMap(() => this.articleService.getList()));

  currentArticle$ = combineLatest([this.currentId$, this.refresh$]).pipe(
    map(([id]) => id),
    filter((id): id is number => id !== null),
    switchMap((id) => this.articleService.getById(id)),
  );

  addNew() {
    this.articleService
      .create({
        name: 'Новая статья',
        text: 'Введите текст',
        segments: [],
      })
      .subscribe(() => this.refresh());
  }

  delete(id: number) {
    this.articleService.delete(id).subscribe(() => this.refresh());
  }

  save(id: number, changes: Pick<Article, 'name' | 'text'>) {
    this.articleService.edit(id, changes).subscribe(() => this.refresh());
  }

  addSegment(id: number, segment: Segment) {
    this.articleService.getById(id).subscribe((article) => {
      if (!article) {
        return;
      }

      this.articleService
        .edit(id, {
          segments: [...article.segments, segment],
        })
        .subscribe(() => this.refresh());
    });
  }

  clearSegments(id: number) {
    this.articleService
      .edit(id, { segments: [] })
      .subscribe(() => this.refresh());
  }

  refresh() {
    this.refreshArticlesSub.next();
  }

  select(id: number) {
    this.currentIdSub.next(id);
  }
}
