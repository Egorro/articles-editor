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
import {
  buildRenderSegments,
  getSelectionOffsets,
  hasIntersection,
  RenderSegment,
} from './current-article.utils';

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
  private readonly store = inject(ArticlesStorService);

  readonly articleMode = ArticleMode;
  currentArticle = toSignal(this.store.currentArticle$, { initialValue: null });
  mode = signal<ArticleMode>(ArticleMode.View);
  renderSegments = computed<RenderSegment[]>(() => {
    const article = this.currentArticle();
    if (!article) {
      return [];
    }

    return buildRenderSegments(article.text, article.segments);
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

  onSave(): void {
    const article = this.currentArticle();
    if (!article) {
      return;
    }

    const { name, text } = this.form.getRawValue();
    this.store.save(article.id, { name, text });
    this.mode.set(ArticleMode.View);
  }

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

    const offsets = getSelectionOffsets(textElement, range);
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

  onSaveAnnotation(draft: AnnotationDraftSave): void {
    const selection = this.pendingSelection();
    const article = this.currentArticle();
    if (!selection || !article) {
      return;
    }

    if (hasIntersection(article.segments, selection.start, selection.end)) {
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

  onCancelAnnotation(): void {
    this.pendingSelection.set(null);
    this.annotationError.set(null);
    window.getSelection()?.removeAllRanges();
  }

  private clearPendingSelection(): void {
    this.pendingSelection.set(null);
    this.annotationError.set(null);
  }

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
}
