import { render, screen, fireEvent } from '@testing-library/react';
import MathToolbar from './MathToolbar';

describe('MathToolbar Component', () => {
  test('renders toolbar with aria label', () => {
    render(<MathToolbar onInsert={() => {}} />);
    expect(screen.getByRole('toolbar')).toHaveAttribute(
      'aria-label',
      'Math symbols toolbar'
    );
  });

  test('calls onInsert with LaTeX snippet when button clicked', () => {
    const onInsert = vi.fn();
    render(<MathToolbar onInsert={onInsert} />);
    fireEvent.click(screen.getByRole('button', { name: /Insert Integral/i }));
    expect(onInsert).toHaveBeenCalledWith('\\int_{a}^{b}');
  });

  test('inserts fraction snippet', () => {
    const onInsert = vi.fn();
    render(<MathToolbar onInsert={onInsert} />);
    fireEvent.click(screen.getByRole('button', { name: /Insert Fraction/i }));
    expect(onInsert).toHaveBeenCalledWith('\\frac{a}{b}');
  });

  test('inserts chemical formula snippet via mhchem', () => {
    const onInsert = vi.fn();
    render(<MathToolbar onInsert={onInsert} />);
    fireEvent.click(
      screen.getByRole('button', { name: /Insert Chemical formula/i })
    );
    expect(onInsert).toHaveBeenCalledWith('\\ce{H2O}');
  });

  test('applies className prop', () => {
    const { container } = render(
      <MathToolbar onInsert={() => {}} className="custom-toolbar" />
    );
    expect(container.querySelector('[role="toolbar"]')).toHaveClass(
      'custom-toolbar'
    );
  });
});