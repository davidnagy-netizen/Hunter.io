export interface ExampleCard {
  score: number;
  program: string;
  title: string;
  support: string;
  own: string;
  date: string;
}
export interface ExcludedExample {
  name: string;
  reason: string;
}
export interface Fact {
  label: string;
  value: string;
  rest?: string;
}
