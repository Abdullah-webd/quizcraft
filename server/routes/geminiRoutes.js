import express from 'express';

const router = express.Router();

// Endpoint to get AI explanation for a question
router.post('/explain', async (req, res) => {
  try {
    const { question, options, correctAnswer, selectedAnswer } = req.body;
    
    if (!question || !options || !correctAnswer) {
      return res.status(400).json({ message: 'Question details are required' });
    }
    
    // Since we can't use the actual Gemini API in this environment,
    // we'll simulate a response with educational content
    
    const isCorrect = correctAnswer === selectedAnswer;
    
    // Generate a simulated explanation
    let explanation = '';
    
    // Example explanations based on question content
    if (question.toLowerCase().includes('capital')) {
      explanation = `The capital city serves as the political center of a country. ${correctAnswer} is the correct answer because it is the official seat of government. Capital cities often host important government buildings, embassies, and cultural institutions.`;
    } else if (question.includes('2 + 2')) {
      explanation = `In mathematics, 2 + 2 equals 4. This is a fundamental arithmetic operation where we add two units to another two units, resulting in four units total. This is part of the base-10 number system we use everyday.`;
    } else {
      explanation = `The correct answer is ${correctAnswer}. When answering multiple-choice questions, it's important to carefully analyze each option. ${correctAnswer} is correct because it aligns with the factual information related to the question. Understanding the core concepts behind this question will help you remember the answer in the future.`;
    }
    
    // Add feedback about the user's choice
    if (isCorrect) {
      explanation += ` You correctly selected ${selectedAnswer}, which demonstrates your understanding of this topic.`;
    } else {
      explanation += ` You selected ${selectedAnswer}, which is incorrect. Remember to review this topic to strengthen your understanding.`;
    }
    
    // Simulate a brief delay to mimic API call
    setTimeout(() => {
      res.json({
        explanation,
        isCorrect
      });
    }, 100);
    
  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ message: 'Failed to generate explanation' });
  }
});

export default router;