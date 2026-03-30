import { Segment } from '../models/article.model';

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

export type RenderSegment =
  | RenderTextSegment
  | RenderAnnotationSegment
  | RenderUnderlineSegment;

export function buildRenderSegments(text: string, segments: Segment[]): RenderSegment[] {
  const sortedSegments = segments.toSorted((a, b) => a.start - b.start);

  if (!sortedSegments.length) {
    return text.length ? [{ type: 'text', start: 0, end: text.length, text }] : [];
  }

  const result: RenderSegment[] = [];
  let cursor = 0;

  sortedSegments.forEach((segment) => {
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
}

export function hasIntersection(segments: Segment[], start: number, end: number): boolean {
  return segments.some((segment) => start < segment.end && end > segment.start);
}

export function getSelectionOffsets(
  textElement: HTMLElement,
  range: Range
): { start: number; end: number } | null {
  const startOffset = getOffsetInTextElement(
    textElement,
    range.startContainer,
    range.startOffset
  );
  const endOffset = getOffsetInTextElement(
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

function getOffsetInTextElement(
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
