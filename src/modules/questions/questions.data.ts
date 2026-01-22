import { Question } from "./questions.types";

export const QUESTIONS_VERSION = "2026-01-22";

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt: "Which Dell line is typically positioned for business laptops?",
    choices: [
      { id: "a", label: "Inspiron" },
      { id: "b", label: "Latitude" },
      { id: "c", label: "Alienware" },
      { id: "d", label: "XPS" },
    ],
    correctChoiceId: "b",
    points: 1,
  },
  {
    id: "q2",
    prompt: "What is a common benefit of a docking station for laptops?",
    choices: [
      { id: "a", label: "More RAM automatically" },
      { id: "b", label: "Extra ports & easy peripheral connection" },
      { id: "c", label: "Longer screen resolution" },
      { id: "d", label: "Free internet" },
    ],
    correctChoiceId: "b",
    points: 1,
  },
];
