import { render, screen } from '@testing-library/react';
import React from 'react';
import PageSkeleton from './PageSkeleton';

describe('PageSkeleton Component', () => {
  it('renders skeletal elements successfully', () => {
    const { container } = render(<PageSkeleton />);
    
    // Check that we have elements with animate-pulse class
    const pulsingElements = container.querySelectorAll('.animate-pulse');
    expect(pulsingElements.length).toBeGreaterThan(0);
    
    // Check that the container matches key layout areas
    expect(container.firstChild).toHaveClass('space-y-8');
  });
});
