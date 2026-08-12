import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ExportModal from './ExportModal';

describe('ExportModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ExportModal isOpen={false} onClose={() => {}} contentType="flashcards" onExport={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders format and layout options', () => {
    render(
      <ExportModal isOpen onClose={() => {}} contentType="flashcards" title="Export Deck" onExport={vi.fn()} />
    );
    expect(screen.getByText('Export Deck')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('EPUB')).toBeInTheDocument();
    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Compact')).toBeInTheDocument();
  });

  it('shows item count when provided', () => {
    render(
      <ExportModal isOpen onClose={() => {}} contentType="flashcards" itemCount={12} onExport={vi.fn()} />
    );
    expect(screen.getByText('12 items ready to export.')).toBeInTheDocument();
  });

  it('shows answer key toggle only for flashcards', () => {
    const { rerender } = render(
      <ExportModal isOpen onClose={() => {}} contentType="flashcards" onExport={vi.fn()} />
    );
    expect(screen.getByText('Include answer key at the bottom')).toBeInTheDocument();

    rerender(<ExportModal isOpen onClose={() => {}} contentType="notes" onExport={vi.fn()} />);
    expect(screen.queryByText('Include answer key at the bottom')).not.toBeInTheDocument();
  });

  it('disables the export button when there are no items', () => {
    render(
      <ExportModal isOpen onClose={() => {}} contentType="flashcards" itemCount={0} onExport={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /Export PDF/i })).toBeDisabled();
  });

  it('calls onExport with the selected format and layout', async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(
      <ExportModal isOpen onClose={() => {}} contentType="flashcards" itemCount={5} onExport={onExport} />
    );

    fireEvent.click(screen.getByText('EPUB'));
    fireEvent.click(screen.getByText('Compact'));
    fireEvent.click(screen.getByRole('button', { name: /Export EPUB/i }));

    await waitFor(() => {
      expect(onExport).toHaveBeenCalledWith({
        format: 'epub',
        layout: 'compact',
        includeAnswerKey: false,
      });
    });
  });

  it('includes the answer key flag when enabled', async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(
      <ExportModal isOpen onClose={() => {}} contentType="flashcards" itemCount={5} onExport={onExport} />
    );

    fireEvent.click(screen.getByText('Include answer key at the bottom'));
    fireEvent.click(screen.getByRole('button', { name: /Export PDF/i }));

    await waitFor(() => {
      expect(onExport).toHaveBeenCalledWith({
        format: 'pdf',
        layout: 'grid',
        includeAnswerKey: true,
      });
    });
  });

  it('shows an error message when export fails', async () => {
    const onExport = vi.fn().mockRejectedValue(new Error('Boom'));
    render(
      <ExportModal isOpen onClose={() => {}} contentType="flashcards" itemCount={3} onExport={onExport} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Export PDF/i }));

    expect(await screen.findByText('Boom')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<ExportModal isOpen onClose={onClose} contentType="flashcards" onExport={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
