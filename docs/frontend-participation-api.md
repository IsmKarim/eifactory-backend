# Participation API — Frontend Integration Guide

This document covers everything the frontend needs to integrate the full participation flow: entering an event, taking the quiz, and submitting answers.

All base URLs are relative to the API root (e.g. `https://api.example.com`).

---

## Table of Contents

1. [Concepts](#1-concepts)
2. [Event Discovery](#2-event-discovery)
3. [Step 1 — Enter / Register](#3-step-1--enter--register)
4. [Step 2 — Start the Quiz](#4-step-2--start-the-quiz)
5. [Step 3 — Submit Answers](#5-step-3--submit-answers)
6. [Full Flow Diagram](#6-full-flow-diagram)
7. [Error Reference](#7-error-reference)

---

## 1. Concepts

| Term | Meaning |
|---|---|
| **Event** | A campaign (identified by a unique `slug`, e.g. `"ramadan-2026"`). |
| **Session** | A time-windowed round within an event (e.g. "Day 1"). Only one session can be active at a time per event. Participation is only possible while a session is active. |
| **Attempt** | One quiz attempt per participant per session. Resumable if the participant calls participate again before submitting. |
| **`alreadyParticipated`** | `true` when the participant already submitted this session. Show a "you already played" screen. |

---

## 2. Event Discovery

### Get event by slug

```
GET /events/:slug
```

Use this to load branding, landing page copy, and the event ID needed for subsequent calls.

**Response**

```json
{
  "_id": "664a1f...",
  "name": "Ramadan 2026",
  "slug": "ramadan-2026",
  "status": "ACTIVE",
  "startDate": "2026-03-01T00:00:00.000Z",
  "endDate": "2026-03-30T23:59:59.000Z",
  "landing": {
    "heroTitle": "Win Big This Ramadan",
    "heroSubtitle": "Answer 5 questions, top the leaderboard",
    "slogan": "Play. Win. Repeat.",
    "prizeDescription": "Grand prize: MacBook Pro",
    "prizeImageUrl": "https://res.cloudinary.com/..."
  },
  "branding": {
    "logoUrl": "https://res.cloudinary.com/...",
    "primaryColor": "#F97316",
    "organizerName": "EiFactory"
  },
  "quiz": {
    "questionCount": 5
  }
}
```

> Store `_id` as `eventId` — you'll pass it to every participation endpoint.

---

## 3. Step 1 — Enter / Register

This single endpoint handles both new and returning participants. Call it every time a participant lands on the quiz page.

```
POST /public/events/:eventId/participate
Content-Type: application/json
```

**Request body**

```json
{
  "email": "jane@example.com",
  "username": "Jane Doe",
  "phone": "+966501234567",
  "companyName": "Acme Corp"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | yes | Must be a valid email. Used as unique identifier. |
| `username` | string | yes | 2–60 characters. |
| `phone` | string | yes | Must be a valid phone number (international format recommended). |
| `companyName` | string | no | Max 200 characters. |

**Response — active session found**

```json
{
  "session": {
    "id": "665b2a...",
    "name": "Day 1",
    "slug": "day-1",
    "dayNumber": 1
  },
  "participant": {
    "id": "665c3f...",
    "username": "Jane Doe",
    "companyName": "Acme Corp",
    "email": "jane@example.com",
    "phone": "+966501234567"
  },
  "attempt": {
    "id": "665d4e...",
    "status": "CREATED",
    "startedAt": null,
    "submittedAt": null,
    "elapsedMs": null,
    "score": 0,
    "correctCount": 0,
    "totalQuestions": 5,
    "questionsVersion": "v1"
  },
  "questions": [
    {
      "id": "q_abc123",
      "prompt": "What is the capital of Saudi Arabia?",
      "imageUrl": "https://res.cloudinary.com/...",
      "choices": [
        { "id": "c_1", "label": "Riyadh" },
        { "id": "c_2", "label": "Jeddah" },
        { "id": "c_3", "label": "Dammam" },
        { "id": "c_4", "label": "Mecca" }
      ],
      "points": 1
    }
    // ... 4 more questions
  ],
  "alreadyParticipated": false
}
```

**Key fields to store after this call**

| Field | Where to find it | Used in |
|---|---|---|
| `attempt.id` | `attempt.id` | Step 2 & 3 |
| `attempt.status` | `attempt.status` | Decide which screen to show |
| `questions` | `questions` | Render quiz |
| `alreadyParticipated` | top-level | Show "already played" screen |

**Frontend logic after this call**

```
if alreadyParticipated === true
  → show "You already participated in this session" screen

else if attempt.status === "SUBMITTED"
  → show score/results screen (edge case: tab refresh after submit)

else if attempt.status === "STARTED"
  → jump directly to Step 2 (resume in-progress quiz)

else (status === "CREATED")
  → show quiz intro / countdown → proceed to Step 2
```

**Possible errors**

| HTTP | Meaning |
|---|---|
| `409 Conflict` | No active session right now. Show "Come back when the session opens" message. |

---

## 4. Step 2 — Start the Quiz

Call this when the participant presses "Start" (or when resuming a `STARTED` attempt — it is idempotent).

```
POST /public/attempts/:attemptId/start
```

No request body required.

**Response** — the updated attempt object

```json
{
  "_id": "665d4e...",
  "status": "STARTED",
  "startedAt": "2026-04-22T10:05:00.000Z",
  "submittedAt": null,
  "elapsedMs": null,
  "score": 0,
  "correctCount": 0,
  "totalQuestions": 5,
  "questionsVersion": "v1"
}
```

> Record `startedAt` locally if you want to display a countdown timer. The server calculates elapsed time on submit.

**Possible errors**

| HTTP | Meaning |
|---|---|
| `400 Bad Request` | Attempt already submitted — skip to results. |
| `404 Not Found` | Invalid attempt ID. |

---

## 5. Step 3 — Submit Answers

Call this once the participant answers all questions.

```
POST /public/attempts/:attemptId/submit
Content-Type: application/json
```

**Request body**

```json
{
  "answers": [
    { "questionId": "q_abc123", "choiceId": "c_1" },
    { "questionId": "q_def456", "choiceId": "c_3" },
    { "questionId": "q_ghi789", "choiceId": "c_2" },
    { "questionId": "q_jkl012", "choiceId": "c_4" },
    { "questionId": "q_mno345", "choiceId": "c_1" }
  ]
}
```

| Field | Type | Rules |
|---|---|---|
| `answers` | array | Must include **all** assigned questions. No duplicates. Only IDs returned in Step 1. |
| `answers[].questionId` | string | Must match one of the `id` values from `questions` returned in Step 1. |
| `answers[].choiceId` | string | Must match one of the `choices[].id` values for that question. |

**Response**

```json
{
  "_id": "665d4e...",
  "status": "SUBMITTED",
  "startedAt": "2026-04-22T10:05:00.000Z",
  "submittedAt": "2026-04-22T10:06:42.000Z",
  "elapsedMs": 102000,
  "score": 4,
  "correctCount": 4,
  "totalQuestions": 5,
  "questionsVersion": "v1"
}
```

| Field | Meaning |
|---|---|
| `score` | Total points earned. |
| `correctCount` | Number of correct answers (out of `totalQuestions`). |
| `elapsedMs` | Time taken in milliseconds (`submittedAt - startedAt`). |

> Correct answers are **never** returned to the client. Do not attempt to infer them.

**Possible errors**

| HTTP | Meaning |
|---|---|
| `400` — "Attempt already submitted." | Duplicate submit — show results from Step 1 response. |
| `400` — "Attempt has not been started." | Step 2 was skipped. Call start first. |
| `400` — "You must answer all N questions." | Missing answers in the payload. |
| `400` — "Duplicate answer for questionId: …" | Same question answered twice. |
| `400` — "Question not part of this attempt: …" | Sent a questionId that wasn't in the assigned set. |
| `404 Not Found` | Invalid attempt ID. |

---

## 6. Full Flow Diagram

```
Frontend                               API
   │                                    │
   │  GET /events/:slug                 │
   │ ─────────────────────────────────► │  Load event branding & ID
   │ ◄───────────────────────────────── │
   │                                    │
   │  POST /public/events/:id/participate│
   │ ─────────────────────────────────► │  Register / resume
   │ ◄───────────────────────────────── │  → attempt + questions
   │                                    │
   │  [if alreadyParticipated → stop]   │
   │                                    │
   │  POST /public/attempts/:id/start   │
   │ ─────────────────────────────────► │  Lock startedAt
   │ ◄───────────────────────────────── │
   │                                    │
   │  [show quiz, collect answers]      │
   │                                    │
   │  POST /public/attempts/:id/submit  │
   │ ─────────────────────────────────► │  Score & persist
   │ ◄───────────────────────────────── │  → score, elapsedMs
   │                                    │
   │  [show results screen]             │
```

---

## 7. Error Reference

| Scenario | HTTP | Message | Suggested UI |
|---|---|---|---|
| No active session | `409` | "No active session right now." | "Session hasn't started yet, check back soon." |
| Already submitted | `400` | "Attempt already submitted." | Show results from stored response. |
| Quiz not started | `400` | "Attempt has not been started." | Call `/start` then retry submit. |
| Missing answers | `400` | "You must answer all N questions." | Highlight unanswered questions. |
| Duplicate answer | `400` | "Duplicate answer for questionId: …" | Enforce one selection per question client-side. |
| Wrong question ID | `400` | "Question not part of this attempt: …" | Use only the IDs returned in Step 1. |
| Attempt not found | `404` | — | Session likely expired; restart flow. |
