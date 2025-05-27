import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  timerMode: {
    type: Boolean,
    default: false
  },
  timeLimit: {
    type: Number,
    required: function() {
      return this.timerMode === true;
    },
    min: 1,
    max: 180, // Maximum 3 hours in minutes
    default: 30
  },
  questions: [{
    type: {
      type: String,
      enum: ['objective', 'theory'],
      required: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    // For objective questions
    answer: [{
      type: String,
      required: function() {
        return this.type === 'objective';
      }
    }],
    correctAnswerIndex: {
      type: Number,
      required: function() {
        return this.type === 'objective';
      },
      min: 0,
      max: 3
    },
    // For theory questions
    expectedAnswer: {
      type: String,
      required: function() {
        return this.type === 'theory';
      },
      trim: true
    },
    mark: {
      type: Number,
      required: function() {
        return this.type === 'theory';
      },
      min: 1,
      max: 10
    }
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;