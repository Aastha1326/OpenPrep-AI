import { render, screen, fireEvent } from '@testing-library/react';
import MathMarkdownEditor from './MathMarkdownEditor';

describe('MathMarkdownEditor Component', () => {
  test('renders textarea with value and calls onChange', () => {
    const onChange = vi.fn();
    render(
      <MathMarkdownEditor
        value="Hello $E = mc^2$"
        onChange={onChange}
        ariaLabel="Card editor"
      />
    );
    const textarea = screen.getByLabelText('Card editor');
    expect(textarea).toHaveValue('Hello $E = mc^2$');
    fireEvent.change(textarea, { target: { value: 'New value' } });
    expect(onChange).toHaveBeenCalledWith('New value');
  });

  test('switches to preview tab and renders math', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MathMarkdownEditor
        value={'Energy: $E = mc^2$'}
        onChange={onChange}
        ariaLabel="Card editor"
      />
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));
    const katex = container.querySelector('.katex');
    expect(katex).toBeInTheDocument();
  });

  test('shows empty preview message when value is blank', () => {
    const onChange = vi.fn();
    render(<MathMarkdownEditor value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));
    expect(screen.getByText(/Nothing to preview yet/)).toBeInTheDocument();
  });

  test('toolbar button inserts snippet at cursor position', () => {
    const onChange = vi.fn();
    render(
      <MathMarkdownEditor
        value="abc"
        onChange={onChange}
        ariaLabel="Card editor"
      />
    );
    const textarea = screen.getByLabelText('Card editor');
    // Place cursor at position 1 (after "a")
    textarea.setSelectionRange(1, 1);
    fireEvent.click(screen.getByRole('button', { name: /Insert Integral/i }));
    expect(onChange).toHaveBeenCalledWith('a\\int_{a}^{b}bc');
  });

  test('renders label with htmlFor association', () => {
    const onChange = vi.fn();
    render(
      <MathMarkdownEditor
        value=""
        onChange={onChange}
        label="Question"
        id="q-editor"
      />
    );
    expect(screen.getByLabelText('Question')).toBeInTheDocument();
  });

  test('renders malformed LaTeX preview without crashing', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MathMarkdownEditor
        value={String.raw`Broken: $\frac{a}{$`}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));
    expect(container.querySelector('.math-renderer')).toBeInTheDocument();
  });
});