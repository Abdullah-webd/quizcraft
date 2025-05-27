import express from 'express';
import mongoose from 'mongoose';
import TheoryQuestion from '../models/TheoryQuestion.js';
import TheoryAttempt from '../models/TheoryAttempt.js';
import Quiz from '../models/Quiz.js';
import run from '../config/gemni.js';

const router = express.Router();

// Get all theory questions
router.get('/', async (req, res) => {
  try {
    const questions = await TheoryQuestion.find()
      .populate('creator', 'username')
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    console.error('Error fetching theory questions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new theory question
router.post('/', async (req, res) => {
  try {
    const { question, sampleAnswer, creator } = req.body;

    if (!question || !sampleAnswer || !creator) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    console.log('Creating theory question:', { question, sampleAnswer, creator });

    const newQuestion = new TheoryQuestion({
      question,
      sampleAnswer,
      creator
    });

    const savedQuestion = await newQuestion.save();

    console.log('✅ Saved Question ID:', savedQuestion._id); // 👀 LOG THE CORRECT ID

    const populatedQuestion = await TheoryQuestion.findById(savedQuestion._id)
      .populate('creator', 'username');

    res.status(201).json(populatedQuestion);
  } catch (error) {
    console.error('Error creating theory question:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit an answer for evaluation
router.post('/evaluate', async (req, res) => {
  try {
    const { userId, questionId, userAnswer, quizId } = req.body;

    if (!userId || !questionId || !userAnswer || !quizId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Invalid question ID format' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Find the exact question from the quiz
    const question = quiz.questions.find(q => q._id.toString() === questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found in quiz' });
    }

    const prompt = `
You are an educational AI. 
Check the student's answer below against the expected answer and determine if it is correct.
Give a simple response with just one of these: "true" or "false".
Question: ${question.question}
Student's Answer: ${userAnswer}
    `;

    const response = await run(prompt);
    console.log('AI Response:', response);

    const isCorrect = response.toLowerCase().includes('true')

    const feedback = isCorrect
      ? "✅ Good job! Your answer is correct."
      : "❌ Your answer is not correct. Here's the expected answer.";

    const attempt = new TheoryAttempt({
      userId,
      questionId,
      userAnswer,
      score: isCorrect ? question.mark : 0,
      feedback,
      isCorrect
    });

    await attempt.save();

    res.json({
      isCorrect,
      feedback,
      sampleAnswer: isCorrect ? null : question.expectedAnswer,
      score: isCorrect ? question.mark : 0
    });
  } catch (error) {
    console.error('💥 Error evaluating answer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get user's theory performance
router.get('/performance/:userId', async (req, res) => {
  try {
    const attempts = await TheoryAttempt.find({ userId: req.params.userId })
      .populate('questionId')
      .sort({ createdAt: -1 });

    const totalAttempts = attempts.length;
    const averageScore = totalAttempts > 0
      ? attempts.reduce((sum, att) => sum + att.score, 0) / totalAttempts
      : 0;

    res.json({
      attempts,
      totalAttempts,
      averageScore: Math.round(averageScore * 10) / 10
    });
  } catch (error) {
    console.error('Error fetching theory performance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
