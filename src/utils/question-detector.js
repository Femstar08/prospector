/**
 * Question Detection Utility
 * Detects questions and analyzes intent signals in text content
 */

class QuestionDetector {
  constructor() {
    // Question word patterns
    this.questionWords = /^(how|what|where|when|why|should|can|could|would|will|do|does|did|is|are|was|were|who|which)/i;
    
    // Help-seeking phrases
    this.helpSeekingPhrases = [
      /need help/i,
      /looking for/i,
      /can anyone/i,
      /advice on/i,
      /recommend/i,
      /suggestion/i,
      /tips/i,
      /guidance/i,
      /help me/i,
      /anyone know/i,
      /does anyone/i
    ];
    
    // Urgency indicators
    this.urgencyIndicators = [
      /urgent/i,
      /asap/i,
      /as soon as possible/i,
      /quickly/i,
      /immediately/i,
      /right away/i,
      /this week/i,
      /this month/i,
      /by next/i,
      /before/i,
      /deadline/i
    ];
    
    // Budget indicators
    this.budgetIndicators = [
      /£\d+/,
      /\$\d+/,
      /budget/i,
      /afford/i,
      /willing to pay/i,
      /looking to spend/i,
      /cost/i,
      /price/i,
      /fee/i
    ];
    
    // Timeline indicators
    this.timelineIndicators = [
      /this month/i,
      /next month/i,
      /by \w+/i,
      /in q[1-4]/i,
      /before tax year/i,
      /end of year/i,
      /within \d+ (days|weeks|months)/i
    ];
    
    // Professional-seeking language
    this.professionalSeekingPhrases = [
      /hire/i,
      /looking for (a|an)/i,
      /need (a|an)/i,
      /recommend (a|an)/i,
      /find (a|an)/i,
      /seeking (a|an)/i,
      /want (a|an)/i,
      /accountant/i,
      /financial advisor/i,
      /consultant/i,
      /professional/i,
      /expert/i,
      /specialist/i
    ];
  }

  /**
   * Check if text contains a question
   * @param {string} text - Text to analyze
   * @returns {boolean}
   */
  isQuestion(text) {
    if (!text || typeof text !== 'string') return false;
    
    const trimmedText = text.trim();
    
    // Check for question mark
    if (trimmedText.includes('?')) return true;
    
    // Check for question words at start
    if (this.questionWords.test(trimmedText)) return true;
    
    // Check for help-seeking phrases
    return this.helpSeekingPhrases.some(pattern => pattern.test(trimmedText));
  }

  /**
   * Extract question type
   * @param {string} text - Text to analyze
   * @returns {string} - Question type: 'how-to', 'recommendation', 'advice', 'help', 'general', 'none'
   */
  extractQuestionType(text) {
    if (!this.isQuestion(text)) return 'none';
    
    const lowerText = text.toLowerCase();
    
    if (/how (do|to|can|should)/i.test(text)) return 'how-to';
    if (/recommend|suggestion|best \w+/i.test(text)) return 'recommendation';
    if (/advice on|advise me|what should i/i.test(text)) return 'advice';
    if (/need help|help me|can anyone help/i.test(text)) return 'help';
    
    return 'general';
  }

  /**
   * Detect urgency in text
   * @param {string} text - Text to analyze
   * @returns {object} - { hasUrgency: boolean, indicators: string[] }
   */
  detectUrgency(text) {
    if (!text) return { hasUrgency: false, indicators: [] };
    
    const indicators = [];
    
    for (const pattern of this.urgencyIndicators) {
      const match = text.match(pattern);
      if (match) {
        indicators.push(match[0]);
      }
    }
    
    return {
      hasUrgency: indicators.length > 0,
      indicators
    };
  }

  /**
   * Detect budget mentions in text
   * @param {string} text - Text to analyze
   * @returns {object} - { hasBudget: boolean, indicators: string[] }
   */
  detectBudget(text) {
    if (!text) return { hasBudget: false, indicators: [] };
    
    const indicators = [];
    
    for (const pattern of this.budgetIndicators) {
      const match = text.match(pattern);
      if (match) {
        indicators.push(match[0]);
      }
    }
    
    return {
      hasBudget: indicators.length > 0,
      indicators
    };
  }

  /**
   * Detect timeline mentions in text
   * @param {string} text - Text to analyze
   * @returns {object} - { hasTimeline: boolean, indicators: string[] }
   */
  detectTimeline(text) {
    if (!text) return { hasTimeline: false, indicators: [] };
    
    const indicators = [];
    
    for (const pattern of this.timelineIndicators) {
      const match = text.match(pattern);
      if (match) {
        indicators.push(match[0]);
      }
    }
    
    return {
      hasTimeline: indicators.length > 0,
      indicators
    };
  }

  /**
   * Detect professional-seeking language
   * @param {string} text - Text to analyze
   * @returns {object} - { seekingProfessional: boolean, indicators: string[] }
   */
  detectProfessionalSeeking(text) {
    if (!text) return { seekingProfessional: false, indicators: [] };
    
    const indicators = [];
    
    for (const pattern of this.professionalSeekingPhrases) {
      const match = text.match(pattern);
      if (match) {
        indicators.push(match[0]);
      }
    }
    
    return {
      seekingProfessional: indicators.length > 0,
      indicators
    };
  }

  /**
   * Analyze text for all question and intent signals
   * @param {string} text - Text to analyze
   * @returns {object} - Complete analysis
   */
  analyze(text) {
    return {
      isQuestion: this.isQuestion(text),
      questionType: this.extractQuestionType(text),
      urgency: this.detectUrgency(text),
      budget: this.detectBudget(text),
      timeline: this.detectTimeline(text),
      professionalSeeking: this.detectProfessionalSeeking(text),
      textLength: text ? text.length : 0
    };
  }
}

module.exports = QuestionDetector;
