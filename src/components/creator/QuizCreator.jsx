import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Clock } from 'lucide-react';
import JSON5 from 'json5';
import api from '../../services/api';
import UserContext from '../../context/UserContext';

function QuizCreator() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [questionsInput, setQuestionsInput] = useState('');
  const [timerMode, setTimerMode] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user not logged in
  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Please enter a username to create quizzes</h2>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const validateAndParseQuestions = (input) => {
    try {
      // Parse input using JSON5 for more flexible format
      const questions = JSON5.parse(input);

      if (!Array.isArray(questions)) {
        throw new Error('Input must be an array');
      }

      // Validate each question
      questions.forEach((q, index) => {
        if (!q.question) {
          throw new Error(`Question ${index + 1} must have a question`);
        }

        if (q.type === 'objective') {
          if (!Array.isArray(q.answer) || q.answer.length !== 4) {
            throw new Error(`Question ${index + 1} must have exactly 4 answers`);
          }
          if (typeof q.correctAnswerIndex !== 'number' || q.correctAnswerIndex < 0 || q.correctAnswerIndex > 3) {
            throw new Error(`Question ${index + 1} must have a valid correctAnswerIndex (0-3)`);
          }
        } else if (q.type === 'theory') {
          if (!q.expectedAnswer) {
            throw new Error(`Question ${index + 1} must have an expectedAnswer`);
          }
          if (!q.mark || q.mark < 1 || q.mark > 10) {
            throw new Error(`Question ${index + 1} must have a mark between 1 and 10`);
          }
        } else {
          throw new Error(`Question ${index + 1} must have a type of 'objective' or 'theory'`);
        }
      });

      return questions;
    } catch (error) {
      throw new Error(`Invalid question format: ${error.message}`);
    }
  };

  const validateQuiz = () => {
    if (!quizTitle.trim()) {
      toast.error('Quiz title is required');
      return false;
    }

    if (!quizDescription.trim()) {
      toast.error('Quiz description is required');
      return false;
    }

    if (!questionsInput.trim()) {
      toast.error('Questions are required');
      return false;
    }

    if (timerMode && (timeLimit < 1 || timeLimit > 180)) {
      toast.error('Time limit must be between 1 and 180 minutes');
      return false;
    }

    try {
      validateAndParseQuestions(questionsInput);
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateQuiz()) return;

  setIsSubmitting(true);

  try {
    const questions = validateAndParseQuestions(questionsInput);

    // Upload theory questions individually
    for (const question of questions) {
      if (question.type === 'theory') {
        const theoryPayload = {
          question: question.question,
          sampleAnswer: question.expectedAnswer,
          creator: user._id,
        };

        await api.post('/api/theory', theoryPayload);
      }
    }

    // Now send full quiz to /api/quizzes as usual
    const quizData = {
      title: quizTitle,
      description: quizDescription,
      questions,
      timerMode,
      timeLimit: timerMode ? timeLimit : null,
      creator: user._id,
    };

    const response = await api.post('/api/quizzes', quizData);
    toast.success('Quiz created successfully!');
    navigate(`/quiz/${response.data._id}`);
  } catch (error) {
    console.error('Error creating quiz:', error);
    toast.error('Failed to create quiz. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};


  const objectiveExample = `[
  {
    type: 'objective',
    question: "What's the capital of France?",
    answer: ["Paris", "London", "Berlin", "Madrid"],
    correctAnswerIndex: 0
  },
  {
    type: 'objective',
    question: "2 + 2?",
    answer: ["3", "4", "5", "22"],
    correctAnswerIndex: 1
  }
]`;

  const theoryExample = `[
  {
    type: 'theory',
    question: "Explain the process of photosynthesis in green plants.",
    expectedAnswer: "Photosynthesis is the process by which green plants use sunlight, carbon dioxide, and water to produce glucose and oxygen. It occurs in the chloroplasts of plant cells, which contain chlorophyll. The overall equation is: 6CO₂ + 6H₂O + sunlight → C₆H₁₂O₆ + 6O₂.",
    mark: 5
  },
  {
    type: 'theory',
    question: "State and explain Newton's First Law of Motion.",
    expectedAnswer: "Newton's First Law states that an object will remain at rest or move in a straight line at constant speed unless acted upon by an external force. This law is also called the law of inertia.",
    mark: 4
  }
]`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold mb-6">Create New Quiz</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="quizTitle" className="form-label">
              Quiz Title
            </label>
            <input
              id="quizTitle"
              type="text"
              className="form-input"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Enter a title for your quiz"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="quizDescription" className="form-label">
              Quiz Description
            </label>
            <textarea
              id="quizDescription"
              className="form-input min-h-[80px]"
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              placeholder="Enter a description for your quiz"
              required
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-4">
              <input
                id="timerMode"
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                checked={timerMode}
                onChange={(e) => setTimerMode(e.target.checked)}
              />
              <label htmlFor="timerMode" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Enable Timer Mode
              </label>
            </div>

            {timerMode && (
              <div className="pl-6 border-l-2 border-primary-100">
                <label htmlFor="timeLimit" className="form-label">
                  Time Limit (minutes)
                </label>
                <input
                  id="timeLimit"
                  type="number"
                  min="1"
                  max="180"
                  className="form-input"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                  required={timerMode}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Set a time limit between 1 and 180 minutes
                </p>
              </div>
            )}
          </div>
          
          <div className="mb-8">
            <label htmlFor="questions" className="form-label">
              Questions Array
            </label>
            <div className="mb-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Question Formats</h3>
                
                <div className="mb-4">
                  <h4 className="font-medium text-primary-700 mb-2">Objective Questions</h4>
                  <pre className="bg-white p-4 rounded-md text-sm overflow-x-auto border border-gray-200">
                    {objectiveExample}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-medium text-primary-700 mb-2">Theory Questions</h4>
                  <pre className="bg-white p-4 rounded-md text-sm overflow-x-auto border border-gray-200">
                    {theoryExample}
                  </pre>
                </div>
              </div>
            </div>
            <textarea
              id="questions"
              className="form-input font-mono text-sm min-h-[200px]"
              value={questionsInput}
              onChange={(e) => setQuestionsInput(e.target.value)}
              placeholder="Paste your questions array here..."
              required
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Quiz
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuizCreator;