import { Component, effect, inject, input } from '@angular/core';
import { Article } from '../models/article.model';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-current-article',
  imports: [ReactiveFormsModule],
  templateUrl: './current-article.html',
  styleUrl: './current-article.scss',
})
export class CurrentArticle {
  article = input.required<Article>();
  private readonly fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    name: [''],
    text: [''],
  });

  constructor() {
    effect(() => {
      const article = this.article();

      this.form.setValue(
        {
          name: article.name,
          text: article.text,
        },
        { emitEvent: false }
      );
    });
  }
}
