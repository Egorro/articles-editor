import { Component, effect, inject, input, output, signal } from '@angular/core';
import { Article } from '../models/article.model';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

enum ArticleMode {
  View = 'view',
  Edit = 'edit',
}

@Component({
  selector: 'app-current-article',
  imports: [ReactiveFormsModule],
  templateUrl: './current-article.html',
  styleUrl: './current-article.scss',
})
export class CurrentArticle {
  readonly articleMode = ArticleMode;
  article = input.required<Article>();
  save = output<{ id: number; changes: Pick<Article, 'name' | 'text'> }>();
  mode = signal<ArticleMode>(ArticleMode.View);
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
        { emitEvent: false },
      );
    });
  }

  onSave(): void {
    const { name, text } = this.form.getRawValue();
    this.save.emit({
      id: this.article().id,
      changes: { name, text },
    });
    this.mode.set(ArticleMode.View);
  }

  setMode(mode: ArticleMode): void {
    this.mode.set(mode);
  }
}
