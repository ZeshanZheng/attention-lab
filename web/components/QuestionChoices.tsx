import type { Question } from '../learning/lessons.ts';

export function QuestionChoices({ question, value, disabled = false, onChange }: {
  question: Question; value: number | null; disabled?: boolean; onChange: (choice: number) => void;
}) {
  return <fieldset className="question-choices" disabled={disabled}>
    <legend>{question.prompt}</legend>
    {question.options.map((option, index) => <label key={option} className={`question-option ${value === index ? 'chosen' : ''}`}>
      <input type="radio" name={question.id} value={index} checked={value === index} onChange={() => onChange(index)} />
      <span>{option}</span>
    </label>)}
  </fieldset>;
}
