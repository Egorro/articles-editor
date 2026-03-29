import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SegmentType } from '../../models/article.model';

export type PendingSelection = {
  start: number;
  end: number;
  selectedText: string;
};

export type AnnotationDraftSave =
  | { type: 'annotation'; color: string; label: string }
  | { type: 'underline'; color: string };

@Component({
  selector: 'app-annotation-draft',
  imports: [ReactiveFormsModule],
  templateUrl: './annotation-draft.html',
  styleUrl: './annotation-draft.scss',
})
export class AnnotationDraft {
  selection = input.required<PendingSelection>();
  error = input<string | null>(null);
  save = output<AnnotationDraftSave>();
  cancel = output<void>();

  private readonly fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<SegmentType>('annotation'),
    color: ['#ff9800'],
    label: [''],
  });

  constructor() {
    effect(() => {
      this.selection();
      this.form.patchValue(
        {
          type: 'annotation',
          label: '',
        },
        { emitEvent: false }
      );
    });
  }

  isAnnotationType(): boolean {
    return this.form.controls.type.value === 'annotation';
  }

  onSave(): void {
    const { type, color, label } = this.form.getRawValue();
    if (type === 'annotation') {
      this.save.emit({
        type,
        color,
        label,
      });
      return;
    }

    this.save.emit({
      type: 'underline',
      color,
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
