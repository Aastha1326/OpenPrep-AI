import { render, screen, fireEvent } from '@testing-library/react';
import LazyImage from './LazyImage';

describe('LazyImage Component', () => {
  test('should render skeleton while image is loading', () => {
    render(<LazyImage src="/test-avatar.jpg" alt="Test Avatar" />);
    const skeleton = screen.getByTestId('lazy-image-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  test('should render img with loading="lazy" attribute', () => {
    render(<LazyImage src="/test-avatar.jpg" alt="Test Avatar" />);
    const img = screen.getByAltText('Test Avatar');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  test('should hide skeleton after image loads', () => {
    render(<LazyImage src="/test-avatar.jpg" alt="Test Avatar" />);
    const img = screen.getByAltText('Test Avatar');
    fireEvent.load(img);
    expect(screen.queryByTestId('lazy-image-skeleton')).not.toBeInTheDocument();
  });

  test('should use fallbackSrc when image fails to load', () => {
    const handleErr = vi.fn();
    render(
      <LazyImage
        src="/broken-image.jpg"
        alt="Broken Image"
        fallbackSrc="/fallback-avatar.png"
        onError={handleErr}
      />
    );
    const img = screen.getByAltText('Broken Image');
    fireEvent.error(img);
    expect(handleErr).toHaveBeenCalled();
  });

  test('should render webp source when webpSrc prop is provided', () => {
    const { container } = render(
      <LazyImage src="/hero.png" webpSrc="/hero.webp" alt="Hero Image" />
    );
    const picture = container.querySelector('picture');
    expect(picture).toBeInTheDocument();
    const source = container.querySelector('source');
    expect(source).toHaveAttribute('srcSet', '/hero.webp');
  });
});
