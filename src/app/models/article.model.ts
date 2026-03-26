export interface Article {
  id: number;
  name: string;
  text: string;
  segments: Annotation[];
}

export interface ArticleListItem {
  id: number;
  name: string;
}

export interface Segment {
  type: string;
  start: number;
  end: number;
}

export interface Annotation extends Segment {
  label: string;
  color: string;
}

export interface Underlying extends Segment {
  color: string;
}
