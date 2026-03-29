import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ArticleList } from './article-list/article-list';
import { CurrentArticle } from './current-article/current-article';

@Component({
  selector: 'app-root',
  imports: [CommonModule, ArticleList, CurrentArticle],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
