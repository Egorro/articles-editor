import { inject, Injectable } from '@angular/core';
import { Article, ArticleListItem } from './models/article.model';
import { StorageService } from './storage.service';
import { Observable, delay, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ArticlesApiService {
  private readonly storage = inject(StorageService);
  private readonly storageKey = 'articles';
  private readonly apiDelayMs = 200;

  constructor() {}

  create(payload: Omit<Article, 'id'>): Observable<Article> {
    const list = this.readAll();
    const article: Article = {
      id: this.nextId(list),
      ...payload,
    };

    list.push(article);
    this.writeAll(list);

    return this.withDelay(article);
  }

  edit(id: number, newArticle: Partial<Omit<Article, 'id'>>): Observable<Article | null> {
    const list = this.readAll();
    const article = list.find((item) => item.id === id);

    if (!article) {
      return this.withDelay(null);
    }

    const updatedArticle: Article = {
      ...article,
      ...newArticle,
      id,
    };
    const nextList = list.map((item) => (item.id === id ? updatedArticle : item));
    this.writeAll(nextList);

    return this.withDelay(updatedArticle);
  }

  delete(id: number): Observable<boolean> {
    const list = this.readAll();
    const newList = list.filter((article) => article.id !== id);

    if (newList.length === list.length) {
      return this.withDelay(false);
    }

    this.writeAll(newList);
    return this.withDelay(true);
  }

  getList(): Observable<ArticleListItem[]> {
    const listItems = this.readAll()
      .map(({id, name}) => ({id, name}));

    return this.withDelay(listItems);
  }

  getById(id: number): Observable<Article | null> {
    return this.withDelay(this.readAll().find((article) => article.id === id) ?? null);
  }

  private readAll(): Article[] {
    return this.storage.get<Article[]>(this.storageKey) ?? [];
  }

  private writeAll(list: Article[]): void {
    this.storage.set<Article[]>(this.storageKey, list);
  }

  private nextId(list: Article[]): number {
    return list.reduce((maxId, article) => (article.id > maxId ? article.id : maxId), 0) + 1;
  }

  private withDelay<T>(value: T): Observable<T> {
    return of(value).pipe(delay(this.apiDelayMs));
  }
}
