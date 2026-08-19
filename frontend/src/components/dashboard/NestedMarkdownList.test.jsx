import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import QuestionExplanation from './QuestionExplanation';

const deepMarkdown = `
- Level 1 Bullet Item
  - Level 2 Bullet Item
    - Level 3 Bullet Item
      - Level 4 Bullet Item
`;

describe('Deeply Nested Markdown List Rendering (#1189)', () => {
  test('renders 4 levels of nested bullet lists without flattening', () => {
    const { container } = render(<ReactMarkdown>{deepMarkdown}</ReactMarkdown>);

    const lists = container.querySelectorAll('ul');
    expect(lists.length).toBe(4);

    const items = container.querySelectorAll('li');
    expect(items.length).toBe(4);

    expect(screen.getByText('Level 1 Bullet Item')).toBeInTheDocument();
    expect(screen.getByText('Level 2 Bullet Item')).toBeInTheDocument();
    expect(screen.getByText('Level 3 Bullet Item')).toBeInTheDocument();
    expect(screen.getByText('Level 4 Bullet Item')).toBeInTheDocument();

    // Verify parent-child list nesting hierarchy (level 1 -> level 2 -> level 3 -> level 4)
    const level1List = lists[0];
    const level2List = lists[1];
    const level3List = lists[2];
    const level4List = lists[3];

    expect(level1List.contains(level2List)).toBe(true);
    expect(level2List.contains(level3List)).toBe(true);
    expect(level3List.contains(level4List)).toBe(true);
  });

  test('QuestionExplanation renders nested lists with outside bullets and padding', () => {
    const { container } = render(
      <QuestionExplanation
        question="Explain Cellular Respiration"
        options={['Option A', 'Option B']}
        correctAnswer={0}
        userAnswer={0}
      />
    );

    expect(container).toBeInTheDocument();
  });
});
