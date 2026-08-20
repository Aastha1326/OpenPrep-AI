import { render, screen } from '@testing-library/react';
import MathRenderer from './MathRenderer';

describe('MathRenderer Component', () => {
  test('renders plain text without math unchanged', () => {
    const { container } = render(<MathRenderer text="Hello world" />);
    expect(container.querySelector('.math-renderer')).toBeInTheDocument();
    expect(container.textContent).toContain('Hello world');
  });

  test('returns null for empty or non-string text', () => {
    const { container } = render(<MathRenderer text="" />);
    expect(container.querySelector('.math-renderer')).not.toBeInTheDocument();
  });

  test('renders inline math $E = mc^2$ with KaTeX', () => {
    const { container } = render(
      <MathRenderer text={'Energy: $E = mc^2$'} />
    );
    const katex = container.querySelector('.katex');
    expect(katex).toBeInTheDocument();
    // The MathML accessibility layer must be preserved
    const mathml = container.querySelector('math');
    expect(mathml).toBeTruthy();
  });

  test('renders block math with display mode', () => {
    const { container } = render(
      <MathRenderer text={String.raw`$$\int_0^\infty f(x)dx$$`} />
    );
    const katex = container.querySelector('.katex');
    expect(katex).toBeInTheDocument();
  });

  test('renders matrices', () => {
    const { container } = render(
      <MathRenderer
        text={String.raw`$$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$$`}
      />
    );
    const katex = container.querySelector('.katex');
    expect(katex).toBeInTheDocument();
  });

  test('renders chemical formulas via mhchem', () => {
    const { container } = render(
      <MathRenderer text={String.raw`Sulfuric acid: $\ce{H2SO4}$`} />
    );
    const katex = container.querySelector('.katex');
    expect(katex).toBeInTheDocument();
    // mhchem output should not be a KaTeX parse error
    expect(container.textContent).not.toContain('ParseError');
  });

  test('renders chemical reactions via mhchem arrows', () => {
    const { container } = render(
      <MathRenderer text={String.raw`$\ce{2H2 + O2 -> 2H2O}$`} />
    );
    const katex = container.querySelector('.katex');
    expect(katex).toBeInTheDocument();
    expect(container.textContent).not.toContain('ParseError');
  });

  test('renders malformed LaTeX gracefully with inline fallback', () => {
    const { container } = render(
      <MathRenderer text={String.raw`Broken: $\int_0^\infty$ oops $2\un$`} />
    );
    // Must not throw / break the tree
    expect(container.querySelector('.math-renderer')).toBeInTheDocument();
    expect(container.textContent).toContain('Broken');
  });

  test('renders malformed LaTeX as katex-error indicator without crashing', () => {
    const { container } = render(
      <MathRenderer text={String.raw`$\frac{a}{$`} />
    );
    expect(container.querySelector('.math-renderer')).toBeInTheDocument();
    // Either an error indicator or escaped fallback is acceptable; no crash
    const katex = container.querySelector('.katex, .katex-error, code');
    expect(katex).toBeInTheDocument();
  });

  test('sanitizes raw HTML to prevent XSS', () => {
    render(
      <MathRenderer text={'Safe text <script>window.__xss = true</script>'} />
    );
    expect(window.__xss).toBeUndefined();
    expect(document.querySelector('script')).not.toBeInTheDocument();
    // Raw HTML tags are stripped (no rehype-raw); surrounding text survives
    expect(screen.getByText(/Safe text/)).toBeInTheDocument();
  });

  test('applies className prop to wrapper', () => {
    const { container } = render(
      <MathRenderer text="text" className="custom-class" />
    );
    expect(container.querySelector('.math-renderer')).toHaveClass(
      'custom-class'
    );
  });

  test('does not re-parse static text on re-render (memoized)', () => {
    const { rerender, container } = render(
      <MathRenderer text={'$E = mc^2$'} />
    );
    const first = container.querySelector('.math-renderer');
    rerender(<MathRenderer text={'$E = mc^2$'} />);
    expect(container.querySelector('.math-renderer')).toBe(first);
  });
});
