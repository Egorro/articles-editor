import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ArticleList } from './article-list/article-list';
import { CurrentArticle } from './current-article/current-article';
import { ArticlesStorService } from './articles-store.service';
import { Annotation, Article } from './models/article.model';

@Component({
  selector: 'app-root',
  imports: [CommonModule, ArticleList, CurrentArticle],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly store = inject(ArticlesStorService);

  articles$ = this.store.articles$;
  currentArticle$ = this.store.currentArticle$;

  addNew() {
    this.store.addNew();
  }

  delete(id: number) {
    this.store.delete(id);
  }

  select(id: number) {
    this.store.select(id);
  }

  save(payload: { id: number; changes: Pick<Article, 'name' | 'text'> }) {
    this.store.save(payload.id, payload.changes);
  }

  addAnnotation(payload: { id: number; annotation: Annotation }) {
    this.store.addAnnotation(payload.id, payload.annotation);
  }
}
