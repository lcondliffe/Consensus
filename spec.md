# LLM Committee - Product Specification

## Overview
LLM Committee is a web application that sends user prompts to multiple AI models simultaneously, streams their responses in real-time, and uses a judge model to evaluate and declare a winner.

## User Stories

### US-1: Submit Prompt to Committee (P1)
**As a user**, I want to submit a prompt and have it sent to multiple LLM models simultaneously, so that I can compare different AI responses to the same question.

**Acceptance Criteria:**
- Given I am on the main page, when I enter a prompt and click "Submit to Committee", then the prompt is sent to all selected models via OpenRouter
- Given a prompt has been submitted, when models begin responding, then I see each response streaming in real-time with its model name clearly labeled
- Given a prompt has been submitted, when one model fails or times out, then the other responses continue streaming and the failed model shows an error state

### US-2: View Committee Verdict (P1)
**As a user**, I want a judge model to evaluate all responses and declare a winner with reasoning, so that I don't have to manually compare lengthy responses.

**Acceptance Criteria:**
- Given all committee models have finished responding, when the judge evaluation completes, then I see a verdict panel showing the winning model name
- Given the verdict is displayed, when I read the reasoning, then it references specific strengths/weaknesses of each response
- Given the judge model fails, when the error occurs, then I still see all individual responses and a message indicating judging failed

### US-3: Configure Committee Models (P2)
**As a user**, I want to select which models participate in the committee and which model acts as judge, so that I can customize evaluations for different use cases.

**Acceptance Criteria:**
- Given I am on the settings/config panel, when I view available models, then I see a list of OpenRouter-supported models
- Given I have selected 3 committee models and 1 judge model, when I submit a prompt, then only those 3 models respond and that judge evaluates
- Given I select fewer than 2 committee models, when I try to submit, then I see a validation error requiring at least 2 models
- Given I select a model as judge, when I view the committee model list, then that model is disabled/excluded from committee selection

### US-4: View Streaming Response Comparison (P2)
**As a user**, I want to see all responses streaming side-by-side in a clear layout, so that I can watch them generate and manually compare if I disagree with the judge.

**Acceptance Criteria:**
- Given a prompt has been submitted, when responses begin streaming, then each response streams into its own card/panel with the model name as header
- Given responses are streaming at different speeds, when viewing the comparison, then each panel updates independently without blocking others
- Given the verdict is shown, when I look at the winning response, then it is visually highlighted or marked

### US-5: Manage API Configuration (P3)
**As a user**, I want to provide my OpenRouter API key securely, so that I can use my own account and credits.

**Acceptance Criteria:**
- Given no API key is configured, when I try to submit a prompt, then I see an error prompting me to add an API key
- Given I enter a valid API key, when I submit a prompt, then the request succeeds
- Given I enter an invalid API key, when I submit a prompt, then I see an authentication error message

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-001 | System MUST send the user's prompt to multiple LLM models via OpenRouter API |
| FR-002 | System MUST query committee models in parallel to minimize total response time |
| FR-003 | System MUST stream responses from each model in real-time as tokens arrive |
| FR-004 | System MUST display each model's response with clear attribution |
| FR-005 | System MUST send all completed responses to a judge model for evaluation (after streaming completes) |
| FR-006 | System MUST display the judge's verdict including winner and reasoning |
| FR-007 | System MUST allow configuration of which models participate in the committee |
| FR-008 | System MUST allow configuration of which model acts as judge |
| FR-009 | System MUST prevent the judge model from being selected as a committee member |
| FR-010 | System MUST validate that at least 2 committee models are selected |
| FR-011 | System MUST handle individual model failures gracefully without blocking other responses |
| FR-012 | System MUST securely handle the OpenRouter API key (not exposed in frontend) |
| FR-013 | System MUST provide loading/streaming states during model inference |
| FR-014 | System MUST run in a Docker container for deployment |

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-001 | First tokens SHOULD appear within 3 seconds of submission |
| NFR-002 | UI MUST be responsive and usable on desktop browsers |
| NFR-003 | Streaming MUST update UI smoothly without flickering or layout shifts |

## Default Configuration

| ID | Configuration |
|----|---------------|
| DC-001 | Default committee models: Claude Sonnet 4, GPT-4o, Gemini 2.0 Flash |
| DC-002 | Default judge model: Claude Sonnet 4 (excluded from committee when acting as judge) |

## Key Entities

### Prompt
The user's input text to be evaluated by the committee.

### CommitteeModel
An LLM model selected to generate a response.
- `model_id`: OpenRouter model identifier
- `display_name`: Human-readable name
- `provider`: Model provider (Anthropic, OpenAI, Google, etc.)

### JudgeModel
The LLM model responsible for evaluating responses and selecting a winner. MUST NOT be in committee.

### Response
A single model's output for a given prompt.
- `model_id`: Which model generated this
- `content`: The response text
- `latency`: Time to complete
- `error_state`: Error message if failed
- `is_streaming`: Whether still receiving tokens

### Verdict
The judge's evaluation result.
- `winner_model_id`: The winning model
- `reasoning`: Explanation referencing specific response qualities
- `scores_per_model`: Individual scores with strengths/weaknesses

### Session
A single prompt submission with its responses and verdict.

## Edge Cases

1. **All committee models fail**: Show error state, no verdict possible
2. **Rate limiting from OpenRouter**: Display rate limit error, allow retry
3. **Judge selected as committee member**: Prevented by UI - judge model disabled in committee selection
4. **Very long prompts exceeding context limits**: Model returns error, handled gracefully per FR-011
5. **Identical/near-identical responses**: Judge still evaluates and picks based on subtle differences
6. **Connection drops mid-response**: Mark response as errored, continue with others

## Success Criteria

| ID | Criterion |
|----|-----------|
| SC-001 | Users see first streaming tokens within 3 seconds of submission |
| SC-002 | Users can identify the winning response within 5 seconds of verdict display |
| SC-003 | System successfully handles 3+ concurrent committee evaluations |
| SC-004 | Judge reasoning references at least 2 specific aspects of the evaluated responses |
| SC-005 | Application deploys successfully via `docker-compose up` with only an API key required |
| SC-006 | Judge model is never included in committee responses |

## Out of Scope (v1)

- User authentication/accounts
- Persistent history of past evaluations
- Cost tracking per query
- Custom judge prompts
- Voting strategies beyond single-judge (e.g., majority vote, ranked choice)
- Mobile-optimized UI
