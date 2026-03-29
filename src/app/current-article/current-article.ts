import {
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Annotation, Article } from '../models/article.model';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AnnotationDraft } from './annotation-draft/annotation-draft';

enum ArticleMode {
  View = 'view',
  Edit = 'edit',
}

@Component({
  selector: 'app-current-article',
  imports: [ReactiveFormsModule, AnnotationDraft],
  templateUrl: './current-article.html',
  styleUrl: './current-article.scss',
})
export class CurrentArticle {
  private readonly textElementRef = viewChild<ElementRef<HTMLElement>>('textElement');

  readonly articleMode = ArticleMode;
  article = input.required<Article>();
  save = output<{ id: number; changes: Pick<Article, 'name' | 'text'> }>();
  addAnnotation = output<{ id: number; annotation: Annotation }>();
  mode = signal<ArticleMode>(ArticleMode.View);
  pendingSelection = signal<{
    start: number;
    end: number;
    selectedText: string;
  } | null>(null);
  annotationError = signal<string | null>(null);
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

  /**
   * Сохраняет изменения из формы и переключает компонент в режим просмотра.
   */
  onSave(): void {
    const { name, text } = this.form.getRawValue();
    this.save.emit({
      id: this.article().id,
      changes: { name, text },
    });
    this.mode.set(ArticleMode.View);
  }

  /**
   * Переключает режим компонента и очищает текущее выделение вне режима просмотра.
   */
  setMode(mode: ArticleMode): void {
    this.mode.set(mode);
    if (mode !== ArticleMode.View) {
      this.pendingSelection.set(null);
      this.annotationError.set(null);
    }
  }

  /**
   * Обрабатывает выделение текста в режиме просмотра и сохраняет координаты выделенного фрагмента.
   */
  onViewerMouseUp(): void {
    if (this.mode() !== ArticleMode.View) {
      return;
    }

    const textElement = this.textElementRef()?.nativeElement;
    if (!textElement) {
      this.clearPendingSelection();
      return;
    }

    const range = this.getValidTextRange(textElement);
    if (!range) {
      this.clearPendingSelection();
      return;
    }

    const offsets = this.getRangeOffsets(textElement, range);
    if (!offsets) {
      this.clearPendingSelection();
      return;
    }

    const text = this.article().text;

    this.pendingSelection.set({
      start: offsets.start,
      end: offsets.end,
      selectedText: text.slice(offsets.start, offsets.end),
    });
    this.annotationError.set(null);
  }

  /**
   * Создает аннотацию для текущего выделения и отправляет ее на сохранение.
   */
  onSaveAnnotation(draft: { color: string; label: string }): void {
    const selection = this.pendingSelection();
    if (!selection) {
      return;
    }

    if (this.hasIntersection(selection.start, selection.end)) {
      this.annotationError.set('Выделение пересекается с существующей аннотацией.');
      return;
    }

    const annotation: Annotation = {
      type: 'annotation',
      start: selection.start,
      end: selection.end,
      color: draft.color,
      label: draft.label.trim(),
    };

    this.addAnnotation.emit({
      id: this.article().id,
      annotation,
    });
    this.onCancelAnnotation();
  }

  /**
   * Отменяет создание аннотации и очищает текущее выделение.
   */
  onCancelAnnotation(): void {
    this.pendingSelection.set(null);
    this.annotationError.set(null);
    window.getSelection()?.removeAllRanges();
  }

  /**
   * Сбрасывает информацию о текущем выделении текста.
   */
  private clearPendingSelection(): void {
    this.pendingSelection.set(null);
    this.annotationError.set(null);
  }

  /**
   * Проверяет, пересекается ли новый диапазон с уже существующими сегментами статьи.
   */
  private hasIntersection(start: number, end: number): boolean {
    return this.article().segments.some(
      (segment) => start < segment.end && end > segment.start
    );
  }

  /**
   * Возвращает валидный Range внутри контейнера просмотра или null, если выделение не подходит.
   */
  private getValidTextRange(textElement: HTMLElement): Range | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed || !textElement.contains(range.commonAncestorContainer)) {
      return null;
    }

    return range;
  }

  /**
   * Вычисляет абсолютные стартовый и конечный оффсеты выделения в пределах текста контейнера.
   */
  private getRangeOffsets(
    textElement: HTMLElement,
    range: Range
  ): { start: number; end: number } | null {
    const startOffset = this.getOffsetInTextElement(
      textElement,
      range.startContainer,
      range.startOffset
    );
    const endOffset = this.getOffsetInTextElement(
      textElement,
      range.endContainer,
      range.endOffset
    );

    if (startOffset === null || endOffset === null || startOffset === endOffset) {
      return null;
    }

    return {
      start: Math.min(startOffset, endOffset),
      end: Math.max(startOffset, endOffset),
    };
  }

  /**
   * Берет позицию внутри DOM (узел + смещение в этом узле)
   * и возвращает индекс символа от начала текста в textElement.
   */
  private getOffsetInTextElement(
    textElement: HTMLElement,
    node: Node,
    offset: number
  ): number | null {
    const range = document.createRange();
    range.selectNodeContents(textElement);

    try {
      range.setEnd(node, offset);
      return range.toString().length;
    } catch {
      return null;
    }
  }
}
