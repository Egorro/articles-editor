export interface Article {
  id: number;
  name: string;
  text: string;
  segments: Segment[];
}

export interface ArticleListItem {
  id: number;
  name: string;
}

export interface BaseSegment {
  type: SegmentType;
  start: number;
  end: number;
}

export type SegmentType = 'annotation' | 'underline';

export interface Annotation extends BaseSegment {
  type: 'annotation';
  label: string;
  color: string;
}

export interface Underline extends BaseSegment {
  type: 'underline';
  color: string;
}

export type Segment = Annotation | Underline;
