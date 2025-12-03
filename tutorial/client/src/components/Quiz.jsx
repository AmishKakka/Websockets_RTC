import React, { useState } from 'react';


const Quiz = ({ title, questions }) => {
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);

  const handleOptionChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
  };

  const checkAnswers = () => {
    let score = 0;
    let total = questions.length;

    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    if (score === total) {
      setFeedback({ 
        type: 'success', 
        msg: `Correct! ${score}/${total}. You have mastered this section.` 
      });
    } else {
      setFeedback({ 
        type: 'error', 
        msg: `You got ${score}/${total} correct. Please review the material.` 
      });
    }
  };

  return (
    <section className="quiz-container">
      <div className="quiz-header">{title}</div>
      
      {questions.map((q, index) => (
        <div className="quiz-question" key={q.id}>
          <p>{index + 1}. {q.question}</p>
          <div className="quiz-options">
            {q.options.map((opt) => (
              <label key={opt.value}>
                <input 
                  type="radio" 
                  name={`question-${q.id}`} 
                  value={opt.value}
                  checked={answers[q.id] === opt.value}
                  onChange={() => handleOptionChange(q.id, opt.value)}
                /> {opt.label}
              </label>
            ))}
          </div>
        </div>
      ))}

      <button className="check-btn" onClick={checkAnswers}>Check Answers</button>
      {feedback && (
        <div className={`result-msg ${feedback.type}`}>
          {feedback.msg}
        </div>
      )}
    </section>
  );
};

export default Quiz;