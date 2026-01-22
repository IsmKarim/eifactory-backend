export type Choice = {
  id: string;      // "a" | "b" | "c" | "d" (or any slug)
  label: string;   // displayed to user
};

export type Question = {
  id: string;              // "q1-dell-latitude"
  prompt: string;          // question text
  choices: Choice[];
  correctChoiceId: string; // stored server-side only (admin + scoring)
  points?: number;         // optional, default 1
};
