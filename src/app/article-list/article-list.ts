import { Component, input, output } from '@angular/core';
import { Article, ArticleListItem } from '../models/article.model';

@Component({
  selector: 'app-article-list',
  imports: [],
  templateUrl: './article-list.html',
  styleUrl: './article-list.scss',
})
export class ArticleList {
  list = input.required<ArticleListItem[] | null>();
  currentArticle = input<Article | null>(null);
  addNew = output();
  delete = output<number>();
  select = output<number>();
}
