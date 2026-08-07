import { splitSentences } from '../utils/textUtils';

const HighlightedText = ({
  text,
  activeIndex = -1,
  className = '',
  highlightClassName = 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100 rounded px-0.5 transition-colors',
  as: Tag = 'p',
}) => {
  if (!text) return null;

  const sentences = splitSentences(text);
  if (sentences.length <= 1) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className}>
      {sentences.map((sentence, index) => (
        <span
          key={index}
          className={index === activeIndex ? highlightClassName : undefined}
        >
          {sentence.text}
          {index < sentences.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
};

export default HighlightedText;
