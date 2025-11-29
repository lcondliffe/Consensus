export interface JudgingCriterion {
  name: string;
  weight: number; // 1-5 importance
  description: string;
}

export interface JudgingCriteria {
  id: string;
  name: string;
  description: string;
  criteria: JudgingCriterion[];
  isCustom?: boolean;
}

// Built-in judging presets
export const JUDGING_PRESETS: JudgingCriteria[] = [
  {
    id: 'general',
    name: 'General Purpose',
    description: 'Balanced evaluation for most prompts',
    criteria: [
      { name: 'Accuracy', weight: 5, description: 'Correctness and factual accuracy of the response' },
      { name: 'Completeness', weight: 4, description: 'Thoroughness in addressing all aspects of the prompt' },
      { name: 'Clarity', weight: 4, description: 'Clear, well-organized, and easy to understand' },
      { name: 'Relevance', weight: 5, description: 'Directly addresses the prompt without tangents' },
      { name: 'Helpfulness', weight: 4, description: 'Practical and actionable for the user' },
    ],
  },
  {
    id: 'code',
    name: 'Code Quality',
    description: 'Evaluates programming and technical responses',
    criteria: [
      { name: 'Correctness', weight: 5, description: 'Code works correctly and handles edge cases' },
      { name: 'Best Practices', weight: 4, description: 'Follows language idioms and coding standards' },
      { name: 'Readability', weight: 4, description: 'Clean, well-structured, properly named' },
      { name: 'Efficiency', weight: 3, description: 'Appropriate time/space complexity' },
      { name: 'Explanation', weight: 4, description: 'Clear explanation of the approach and code' },
      { name: 'Error Handling', weight: 3, description: 'Handles errors and edge cases appropriately' },
    ],
  },
  {
    id: 'creative',
    name: 'Creative Writing',
    description: 'Evaluates stories, poetry, and creative content',
    criteria: [
      { name: 'Creativity', weight: 5, description: 'Original ideas, unique perspectives, imaginative' },
      { name: 'Engagement', weight: 5, description: 'Captivating, holds attention, emotionally resonant' },
      { name: 'Style', weight: 4, description: 'Distinctive voice, appropriate tone, literary quality' },
      { name: 'Structure', weight: 3, description: 'Well-paced, coherent narrative or logical flow' },
      { name: 'Language', weight: 4, description: 'Rich vocabulary, vivid imagery, polished prose' },
    ],
  },
  {
    id: 'factual',
    name: 'Factual Accuracy',
    description: 'Prioritizes correctness for research and factual queries',
    criteria: [
      { name: 'Accuracy', weight: 5, description: 'Factually correct, verifiable information' },
      { name: 'Sources', weight: 4, description: 'References authoritative sources when appropriate' },
      { name: 'Nuance', weight: 4, description: 'Acknowledges complexity, avoids oversimplification' },
      { name: 'Objectivity', weight: 4, description: 'Balanced, presents multiple perspectives if relevant' },
      { name: 'Completeness', weight: 3, description: 'Covers key aspects without unnecessary detail' },
    ],
  },
  {
    id: 'concise',
    name: 'Concise & Direct',
    description: 'Rewards brevity and directness',
    criteria: [
      { name: 'Brevity', weight: 5, description: 'Gets to the point quickly, no unnecessary words' },
      { name: 'Directness', weight: 5, description: 'Answers the question immediately and clearly' },
      { name: 'Accuracy', weight: 4, description: 'Correct despite being brief' },
      { name: 'Completeness', weight: 3, description: 'Covers essentials without over-explaining' },
    ],
  },
  {
    id: 'educational',
    name: 'Educational',
    description: 'Evaluates explanations and teaching quality',
    criteria: [
      { name: 'Clarity', weight: 5, description: 'Easy to understand, appropriate for audience' },
      { name: 'Accuracy', weight: 5, description: 'Factually correct information' },
      { name: 'Examples', weight: 4, description: 'Uses helpful examples and analogies' },
      { name: 'Structure', weight: 4, description: 'Logical progression, builds understanding' },
      { name: 'Depth', weight: 3, description: 'Appropriate level of detail' },
    ],
  },
  {
    id: 'persuasive',
    name: 'Persuasive',
    description: 'Evaluates arguments and persuasive writing',
    criteria: [
      { name: 'Argument Strength', weight: 5, description: 'Logical, well-reasoned arguments' },
      { name: 'Evidence', weight: 4, description: 'Supports claims with evidence or examples' },
      { name: 'Rhetoric', weight: 4, description: 'Effective persuasive techniques' },
      { name: 'Counterarguments', weight: 3, description: 'Addresses potential objections' },
      { name: 'Conclusion', weight: 4, description: 'Strong, memorable conclusion' },
    ],
  },
];

export const DEFAULT_CRITERIA_ID = 'general';

export function getCriteriaById(id: string): JudgingCriteria | undefined {
  return JUDGING_PRESETS.find((c) => c.id === id);
}

export function createCustomCriteria(
  name: string,
  description: string,
  criteria: JudgingCriterion[]
): JudgingCriteria {
  return {
    id: 'custom',
    name,
    description,
    criteria,
    isCustom: true,
  };
}

// Format criteria for the judge prompt
export function formatCriteriaForPrompt(criteria: JudgingCriteria): string {
  const lines = criteria.criteria.map(
    (c) => `- **${c.name}** (importance: ${c.weight}/5): ${c.description}`
  );
  return lines.join('\n');
}
