Below is a **high-level database design** intended to support an eventual LLM evaluation (aka “evals”) system. This design extends your existing schema (requests, responses, results, etc.) so that, down the road, you can systematically store, re-run, and analyze evaluations for your LLM-powered app.

---

## Overview

To enable future evaluations, you’ll need additional tables and fields to store:

1. **Evaluation scenarios and test cases**  
   - Datasets or question/answer pairs you specifically craft to test the system (e.g., “happy path,” “edge case,” “adversarial case,” etc.)

2. **Evaluation runs**  
   - Each time you run a batch of tests (or single test) against the system—storing which model versions, prompts, or system states were used.

3. **Evaluation results**  
   - Individual pass/fail, scores, or LLM-based judgments for each test case, plus logs of how the LLM responded, how it used any retrieval steps, etc.

4. **Observability / user logs** (optional or separate)  
   - Real user interactions in production that you can periodically feed back into your test dataset.

Below is a more concrete breakdown of the recommended schema additions and how they interact with your current DB design.

---

## New Tables for Evals

### 1. `eval_scenarios` (top-level grouping of test sets)

- **Purpose**: Group test cases by scenario or “benchmark.” For instance, you might have a scenario named “Telegram-Prompt-Eval-2025-Q1” or “Hallucination-EdgeCase-Eval.”
- **Key Columns**:
  - `id` (uuid PK)
  - `name` (text): short name of the eval scenario
  - `description` (text): e.g. “Contains 50 curated test questions focusing on brand mentions”
  - `created_at` / `updated_at` (timestamps)

<details>
<summary>Schema Example</summary>

```ts
export const evalScenariosTable = pgTable("eval_scenarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
```
</details>

---

### 2. `eval_testcases` (individual test items)

- **Purpose**: Each row represents a single test input (and optionally a reference “gold” output). For example, one test might be “User asks: ‘How do I write a post about AI?’” with an expected or reference reply.
- **Key Columns**:
  - `id` (uuid PK)
  - `scenario_id` (FK to `eval_scenarios.id`)
  - `input_text` (text): The user’s prompt or question
  - `reference_output` (text, nullable): The “ground truth” answer, if you have one  
  - `metadata` (jsonb or text): Could store category, difficulty, etc.
  - `created_at` / `updated_at`

<details>
<summary>Schema Example</summary>

```ts
export const evalTestcasesTable = pgTable("eval_testcases", {
  id: uuid("id").defaultRandom().primaryKey(),
  scenarioId: uuid("scenario_id")
    .references(() => evalScenariosTable.id, { onDelete: "cascade" })
    .notNull(),
  inputText: text("input_text").notNull(),
  referenceOutput: text("reference_output"),
  metadata: jsonb("metadata"), // optional
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
```
</details>

---

### 3. `eval_runs` (batch or single “run” of an evaluation)

- **Purpose**: Each time you run a set of testcases against your LLM pipeline, you create one row here. This tracks *which model(s)*, *what prompt version*, or *what environment settings* you used.
- **Key Columns**:
  - `id` (uuid PK)
  - `scenario_id` (FK to `eval_scenarios.id`): which scenario you’re testing
  - `model_name` (text) or `selected_models` (text)
  - `run_config` (jsonb or text): store extra data like prompt revision, temperature, etc.
  - `run_timestamp` (timestamp): when the run started
  - `completed_timestamp` (timestamp, nullable): when the run ended

<details>
<summary>Schema Example</summary>

```ts
export const evalRunsTable = pgTable("eval_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  scenarioId: uuid("scenario_id")
    .references(() => evalScenariosTable.id, { onDelete: "cascade" })
    .notNull(),
  modelName: text("model_name").notNull(), // e.g. "chatgpt" or "claude"
  runConfig: jsonb("run_config"),         // e.g. { temperature: 0.7, promptVersion: "v2.1" }
  runTimestamp: timestamp("run_timestamp").defaultNow().notNull(),
  completedTimestamp: timestamp("completed_timestamp"),
});
```
</details>

---

### 4. `eval_results` (store each test output + scored metrics)

- **Purpose**: One row per `(testcase, eval_run)` to store:
  - The actual output your system produced
  - Whether it matched or partially matched the reference output
  - Any numeric or string-based metrics (e.g., BLEU, ROUGE, similarity) or “LLM-as-a-Judge” feedback
- **Key Columns**:
  - `id` (uuid PK)
  - `run_id` (FK to `eval_runs.id`)
  - `testcase_id` (FK to `eval_testcases.id`)
  - `output_text` (text): The model’s actual answer
  - `score` (numeric, nullable): e.g. 0.8 from a similarity approach
  - `judgment` (text or enum, nullable): e.g. “pass,” “fail,” “needs review”
  - `metrics` (jsonb or text): store any structured scoring breakdown (e.g. {rouge: 0.7, hallucinationCheck: false})
  - `created_at` / `updated_at`

<details>
<summary>Schema Example</summary>

```ts
export const evalResultsTable = pgTable("eval_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id")
    .references(() => evalRunsTable.id, { onDelete: "cascade" })
    .notNull(),
  testcaseId: uuid("testcase_id")
    .references(() => evalTestcasesTable.id, { onDelete: "cascade" })
    .notNull(),
  outputText: text("output_text").notNull(),
  score: float("score"),
  judgment: text("judgment"), // e.g. "pass", "fail", "neutral"
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
```
</details>

---

## Potential Enhancements / Variations

1. **LLM-as-a-Judge**  
   - You may store that LLM’s auto-judgment in `eval_results.metrics` or in a dedicated table (`eval_judgments`) if you want more granular logs.

2. **User Feedback**  
   - If real users can up/down-vote or label responses, a `user_feedback` table referencing `request_id` or `eval_results.id` can track that. You can funnel real “bad responses” into your testcases for future regression checks.

3. **Model Versions**  
   - If you frequently swap between versions (like “chatgpt-4.0” vs “chatgpt-4.1,” or different system prompts), store these details in `eval_runs.run_config`. The more details you keep, the easier it is to replicate or compare runs.

4. **Trace of Tools** (e.g., for RAG or AI agents)  
   - If your system calls an internal retrieval step or a knowledge base, you can store the logs in a “trace” or “step” table. That helps you evaluate each sub-step.

---

## Relationship Diagram (Conceptual)

```
        +--------------------+          +--------------------+
        | eval_scenarios    |          | eval_testcases     |
        |--------------------|1        *|--------------------|
        | id (PK)           |<----------| scenario_id (FK)   |
        | name              |          | input_text         |
        | ...               |          | reference_output   |
        +--------------------+          | ...                |
                 |                               
                 | 1                    
                 |                    
                 v                    
        +--------------------+          +--------------------+
        | eval_runs         |          | eval_results       |
        |--------------------|1        *|--------------------|
        | id (PK)           |<----------| run_id (FK)        |
        | scenario_id (FK)  |          | testcase_id (FK)   |
        | model_name        |          | output_text        |
        | run_config        |          | judgment           |
        | run_timestamp     |          | metrics (json)     |
        +--------------------+          | ...                |
                                        +--------------------+
```

- `eval_scenarios` -> `eval_testcases` is a **1-to-many**.
- `eval_scenarios` -> `eval_runs` is also **1-to-many**.
- `eval_runs` -> `eval_results` is **1-to-many**, and each `eval_results` references a single `eval_testcases`.

---

## Integrating With Existing Tables

Your existing tables (`requests`, `responses`, `results`, etc.) can remain mostly unchanged. They are capturing *production usage*. The new eval tables are about *pre-planned test sets, synthetic data, or re-run of actual logs with scoring*.

- **If you want to turn real user requests into testcases**: 
  - You can periodically upsert them into `eval_testcases` so you can re-run them in “regression tests” or to measure how the system evolves across model changes.
- **If you want to log “eval results” side by side with normal “results”**:
  - Keep them separate: your normal `resultsTable` is for “actual user session outputs.” The `eval_resultsTable` is for “test scenario outputs.”  

---

## Implementation Steps

1. **Create new tables**: `eval_scenarios`, `eval_testcases`, `eval_runs`, `eval_results`.
2. **Extend code** (queries, actions) to:
   - Insert scenario definitions and testcases.
   - Launch an eval run (inserting a row in `eval_runs`).
   - For each testcase, call your LLM system, store the output, store the metric(s) in `eval_results`.
3. **(Optional) Add user feedback table** or additional columns in `eval_results` for LLM-based auto-judgment or user rating.

---

## Architectural Considerations

- **JSON / JSONB columns**: Great for storing flexible metadata or structured metrics that might evolve over time.
- **Cascade Delete**: The examples above show `onDelete: "cascade"`. This helps keep the DB clean if you remove a scenario with all associated testcases.
- **Indexing**: 
  - Typically, you’ll index FKs (scenario_id, run_id, testcase_id) for efficient joins.
- **Versioning**: 
  - If you expect frequent changes to testcases, you can add a version column or a “soft-deleted” approach. Alternatively, you can keep it simple at first.
- **Disk usage**: 
  - If you store large `output_text`s or logs, watch for DB bloat. Prune or archive old runs if needed.

---

## Summary

By adding **four new tables**—`eval_scenarios`, `eval_testcases`, `eval_runs`, and `eval_results`—you can systematically store test data, run evaluations, and capture the results (scores, judgments, etc.). This structure covers:

- **What** you tested (scenario + testcases)
- **How** you tested it (which model/prompt config in `eval_runs`)
- **What** the LLM produced and how it scored (`eval_results`)

Over time, this lets you:

1. **Compare** different models or prompt changes on the same test set.  
2. **Add new** testcases for newly discovered edge cases.  
3. **Track** the system’s performance historically (regression tests).  
4. **Observe** which areas need improvement (e.g., safety, factual correctness).

This design provides a robust **foundation** for future LLM evaluation workflows, including *LLM-as-a-Judge*, *manual labeling*, *semantic similarity scoring*, or anything else that arises as your product grows.