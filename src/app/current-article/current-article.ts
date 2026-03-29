import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Annotation } from '../models/article.model';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AnnotationDraft, AnnotationDraftSave } from './annotation-draft/annotation-draft';
import { ArticlesStorService } from '../articles-store.service';

enum ArticleMode {
  View = 'view',
  Edit = 'edit',
}

type RenderTextSegment = {
  type: 'text';
  start: number;
  end: number;
  text: string;
};

type RenderAnnotationSegment = {
  type: 'annotation';
  start: number;
  end: number;
  text: string;
  color: string;
  label: string;
};

type RenderUnderlineSegment = {
  type: 'underline';
  start: number;
  end: number;
  text: string;
  color: string;
};

type RenderSegment = RenderTextSegment | RenderAnnotationSegment | RenderUnderlineSegment;

@Component({
  selector: 'app-current-article',
  imports: [ReactiveFormsModule, AnnotationDraft],
  templateUrl: './current-article.html',
  styleUrl: './current-article.scss',
})
export class CurrentArticle {
  private readonly textElementRef = viewChild<ElementRef<HTMLElement>>('textElement');
  private readonly store = inject(ArticlesStorService);

  readonly articleMode = ArticleMode;
  currentArticle = toSignal(this.store.currentArticle$, { initialValue: null });
  mode = signal<ArticleMode>(ArticleMode.View);
  renderSegments = computed<RenderSegment[]>(() => {
    const article = this.currentArticle();
    if (!article) {
      return [];
    }

    const text = article.text;
    const segments = article.segments.toSorted((a, b) => a.start - b.start);

    if (!segments.length) {
      return text.length ? [{ type: 'text', start: 0, end: text.length, text }] : [];
    }

    const result: RenderSegment[] = [];
    let cursor = 0;

    segments.forEach((segment) => {
      if (segment.start > cursor) {
        result.push({
          type: 'text',
          start: cursor,
          end: segment.start,
          text: text.slice(cursor, segment.start),
        });
      }

      if (segment.type === 'annotation') {
        result.push({
          type: 'annotation',
          start: segment.start,
          end: segment.end,
          text: text.slice(segment.start, segment.end),
          color: segment.color,
          label: segment.label,
        });
      } else {
        result.push({
          type: 'underline',
          start: segment.start,
          end: segment.end,
          text: text.slice(segment.start, segment.end),
          color: segment.color,
        });
      }

      cursor = segment.end;
    });

    if (cursor < text.length) {
      result.push({
        type: 'text',
        start: cursor,
        end: text.length,
        text: text.slice(cursor),
      });
    }

    return result;
  });
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
      const article = this.currentArticle();
      if (!article) {
        return;
      }

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
    const article = this.currentArticle();
    if (!article) {
      return;
    }

    const { name, text } = this.form.getRawValue();
    this.store.save(article.id, { name, text });
    this.mode.set(ArticleMode.View);
  }

  /**
   * Переключает режим компонента и очищает текущее выделение вне режима просмотра.
   */
  setMode(mode: ArticleMode): void {
    if (mode === ArticleMode.Edit && this.mode() !== ArticleMode.Edit) {
      const article = this.currentArticle();

      if (article && article.segments.length > 0) {
        const confirmed = window.confirm(
          'При переходе в режим редактирования все аннотации и подчеркивания будут удалены. Продолжить?'
        );
        
        if (!confirmed) {
          return;
        }

        this.store.clearSegments(article.id);
      }
    }

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

    const article = this.currentArticle();
    if (!article) {
      this.clearPendingSelection();
      return;
    }

    this.pendingSelection.set({
      start: offsets.start,
      end: offsets.end,
      selectedText: article.text.slice(offsets.start, offsets.end),
    });
    this.annotationError.set(null);
  }

  /**
   * Создает аннотацию для текущего выделения и отправляет ее на сохранение.
   */
  onSaveAnnotation(draft: AnnotationDraftSave): void {
    const selection = this.pendingSelection();
    const article = this.currentArticle();
    if (!selection || !article) {
      return;
    }

    if (this.hasIntersection(selection.start, selection.end)) {
      this.annotationError.set('Выделение пересекается с существующей аннотацией.');
      return;
    }

    if (draft.type === 'annotation') {
      const annotation: Annotation = {
        type: 'annotation',
        start: selection.start,
        end: selection.end,
        color: draft.color,
        label: draft.label.trim(),
      };
      this.store.addSegment(article.id, annotation);
    } else {
      this.store.addSegment(article.id, {
        type: 'underline',
        start: selection.start,
        end: selection.end,
        color: draft.color,
      });
    }

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
    const article = this.currentArticle();
    if (!article) {
      return false;
    }

    return article.segments.some(
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

