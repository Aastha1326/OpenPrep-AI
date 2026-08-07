import { render, screen } from '@testing-library/react';
import HighlightedText from './HighlightedText';

describe('HighlightedText', () => {
  it('renders nothing for an empty text', () => {
    const { container } = render(<HighlightedText text="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a single sentence as plain text without spans', () => {
    const { container } = render(<HighlightedText text="A single sentence." />);
    expect(screen.getByText('A single sentence.')).toBeInTheDocument();
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });

  it('splits text into sentence spans and highlights the active one', () => {
    const { container } = render(
      <HighlightedText text="First sentence here. Second sentence there." activeIndex={1} />
    );
    const spans = container.querySelectorAll('span');
    expect(spans).toHaveLength(2);
    expect(spans[0]).toHaveTextContent('First sentence here.');
    expect(spans[1]).toHaveTextContent('Second sentence there.');
    expect(spans[1].className).toContain('bg-amber-200');
    expect(spans[0].className).not.toContain('bg-amber-200');
  });

  it('uses the as prop for the wrapping element', () => {
    const { container } = render(<HighlightedText as="div" text="Wrapped text." />);
    expect(container.querySelector('div')).toHaveTextContent('Wrapped text.');
  });
});
