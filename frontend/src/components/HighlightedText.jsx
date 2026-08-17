import { Fragment } from 'react';
import { toSentenceSegments } from '../utils/textUtils';

/**
 * Renders text one sentence per span so the read-along highlight can target a
 * single sentence.
 *
 * Segments carry the exact whitespace that preceded them. Rejoining with a
 * hard-coded ' ' — as this used to — collapsed every newline in a note into a
 * single space, so a multi-paragraph note rendered as one run-on block.
 */
const HighlightedText = ({
  text,
  activeIndex = -1,
  className = '',
  highlightClassName = 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100 rounded px-0.5 transition-colors',
  as: Tag = 'p',
}) => {
  if (!text) return null;

  const segments = toSentenceSegments(text);
  if (segments.length <= 1) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {segments.map((segment, index) => (
        // Fragment rather than a wrapping span: one span per sentence keeps
        // the DOM addressable by index for tests and for the highlight.
        <Fragment key={index}>
          {segment.lead}
          <span className={index === activeIndex ? highlightClassName : undefined}>
            {segment.text}
          </span>
          {segment.trail}
        </Fragment>
      ))}
    </Tag>
  );
};

export default HighlightedText;
