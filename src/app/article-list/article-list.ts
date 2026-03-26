import { Component, input, output } from '@angular/core';
import { ArticleListItem } from '../models/article.model';

@Component({
  selector: 'app-article-list',
  imports: [],
  templateUrl: './article-list.html',
  styleUrl: './article-list.scss',
})
export class ArticleList {
  list = input.required<ArticleListItem[] | null>();
  addNew = output();
  delete = output<number>();
}
