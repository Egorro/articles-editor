import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ArticlesStorService } from '../articles-store.service';

@Component({
  selector: 'app-article-list',
  imports: [],
  templateUrl: './article-list.html',
  styleUrl: './article-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleList {
  private readonly store = inject(ArticlesStorService);

  list = toSignal(this.store.articles$, { initialValue: [] });
  currentArticle = toSignal(this.store.currentArticle$, { initialValue: null });

  addNew(): void {
    this.store.addNew();
  }

  delete(id: number, event: Event): void {
    event.stopPropagation();
    this.store.delete(id);
  }

  select(id: number): void {
    this.store.select(id);
  }
}
