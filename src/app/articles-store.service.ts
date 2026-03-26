import { inject, Injectable } from '@angular/core';
import { ArticlesApiService } from './articles-api.service';
import { BehaviorSubject, combineLatest, filter, startWith, Subject, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ArticlesStorService {
  private readonly articleService = inject(ArticlesApiService);
  private readonly currentIdSub = new BehaviorSubject<number | null>(null);
  private readonly refreshArticlesSub = new Subject<void>();

  private readonly currentId$ = this.currentIdSub.asObservable();
  readonly articles$ = combineLatest([
    this.refreshArticlesSub.pipe(startWith(null)),
  ]).pipe(
    tap(() => console.log('fdffdf')),
    switchMap(() => this.articleService.getList())
  );


  currentArticle$ = this.currentId$.pipe(
    filter(val => val !== null),
    switchMap(id => this.articleService.getById(id))
  )

  addNew() {
    this.articleService.create({
        name: 'Новая статья',
        text: 'Введите текст',
        segments: [],
    }).subscribe(() => this.refresh());
  }

  delete(id: number) {
    console.log('delete', id)
    this.articleService.delete(id).subscribe(() => this.refresh());
  }

  refresh() {
    console.log('refresh');
    this.refreshArticlesSub.next();
  }
}
