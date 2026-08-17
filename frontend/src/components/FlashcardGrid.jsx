import React, { useState, useEffect, useRef } from 'react';
import { Grid } from 'react-window';
import FlashcardCard from './FlashcardCard';

const FlashcardGrid = ({ flashcards = [], searchVal = '' }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Filter flashcards based on search query
  const filteredCards = flashcards.filter((card) => {
    if (!searchVal) return true;
    const query = searchVal.toLowerCase();
    return (
      (card.front && card.front.toLowerCase().includes(query)) ||
      (card.back && card.back.toLowerCase().includes(query))
    );
  });

  // Track size of the container for dynamic columns
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: width || 800,
          height: height || 600,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const cardWidth = 240;
  const cardHeight = 180;

  // Calculate columns based on width
  const columnCount = Math.max(1, Math.floor(dimensions.width / cardWidth));
  const rowCount = Math.ceil(filteredCards.length / columnCount);

  // Cell renderer matching react-window Grid component expectations
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const cardIndex = rowIndex * columnCount + columnIndex;
    if (cardIndex >= filteredCards.length) return null;

    const flashcard = filteredCards[cardIndex];
    return (
      <FlashcardCard
        key={flashcard.id || cardIndex}
        flashcard={flashcard}
        style={style}
      />
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px]">
      {filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
          <p className="text-sm italic">No flashcards found matching search query.</p>
        </div>
      ) : (
        <Grid
          columnCount={columnCount}
          columnWidth={dimensions.width / columnCount}
          rowCount={rowCount}
          rowHeight={cardHeight}
          cellComponent={Cell}
          cellProps={{}}
          height={dimensions.height}
          width={dimensions.width}
        />
      )}
    </div>
  );
};

export default FlashcardGrid;
