import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

export type PendingSelection = {
  start: number;
  end: number;
  selectedText: string;
};

@Component({
  selector: 'app-annotation-draft',
  imports: [ReactiveFormsModule],
  templateUrl: './annotation-draft.html',
  styleUrl: './annotation-draft.scss',
})
export class AnnotationDraft {
  selection = input.required<PendingSelection>();
  error = input<string | null>(null);
  save = output<{ color: string; label: string }>();
  cancel = output<void>();

  private readonly fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    color: ['#ff9800'],
    label: [''],
  });

  constructor() {
    effect(() => {
      this.selection();
      this.form.patchValue(
        {
          label: '',
        },
        { emitEvent: false }
      );
    });
  }

  onSave(): void {
    const { color, label } = this.form.getRawValue();
    this.save.emit({
      color,
      label,
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
