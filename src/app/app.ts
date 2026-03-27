import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ArticleList } from './article-list/article-list';
import { CurrentArticle } from './article/article';
import { ArticlesStorService } from './articles-store.service';

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
}
