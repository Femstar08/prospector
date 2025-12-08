/**
 * Intent Scoring Engine
 * Calculates question quality, intent, decision stage, and help-seeking scores
 */

const QuestionDetector = require('../utils/question-detector');

class IntentScorer {
  constructor() {
    this.questionDetector = new QuestionDetector();
  }

  /**
   * Calculate question quality score (0-100)
   * Based on specificity, detail, and clarity
   * @param {string} questionText - The question text
   * @param {object} analysis - Question analysis from QuestionDetector
   * @returns {number} - Score 0-100
   */
  calculateQuestionQualityScore(questionText, analysis = null) {
    if (!questionText) return 0;
    
    const analyzed = analysis || this.questionDetector.analyze(questionText);
    
    if (!analyzed.isQuestion) return 0;
    
    let score = 40; // Base score for being a question
    
    // Length indicates detail (longer = more specific)
    if (analyzed.textLength > 200) score += 20;
    else if (analyzed.textLength > 100) score += 15;
    else if (analyzed.textLength > 50) score += 10;
    
    // Question type quality
    if (analyzed.questionType === 'how-to') score += 15; // Specific actionable question
    else if (analyzed.questionType === 'recommendation') score += 20; // High intent
    else if (analyzed.questionType === 'advice') score += 15;
    else if (analyzed.questionType === 'help') score += 10;
    
    // Has question mark (explicit question)
    if (questionText.includes('?')) score += 10;
    
    // Multiple sentences indicate detail
    const sentences = questionText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 2) score += 15;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate intent score (0-100)
   * Based on urgency, budget, timeline, and professional-seeking signals
   * @param {string} text - Text to analyze
   * @param {object} analysis - Question analysis from QuestionDetector
   * @returns {number} - Score 0-100
   */
  calculateIntentScore(text, analysis = null) {
    if (!text) return 0;
    
    const analyzed = analysis || this.questionDetector.analyze(text);
    
    let score = 0;
    
    // Urgency indicators (+20)
    if (analyzed.urgency.hasUrgency) {
      score += 20;
    }
    
    // Budget mentioned (+15)
    if (analyzed.budget.hasBudget) {
      score += 15;
    }
    
    // Timeline mentioned (+15)
    if (analyzed.timeline.hasTimeline) {
      score += 15;
    }
    
    // Professional-seeking language (+25)
    if (analyzed.professionalSeeking.seekingProfessional) {
      score += 25;
    }
    
    // Specific problem (long detailed text) (+15)
    if (analyzed.textLength > 100 && analyzed.isQuestion) {
      score += 15;
    }
    
    // Multiple intent signals (bonus)
    const signalCount = [
      analyzed.urgency.hasUrgency,
      analyzed.budget.hasBudget,
      analyzed.timeline.hasTimeline,
      analyzed.professionalSeeking.seekingProfessional
    ].filter(Boolean).length;
    
    if (signalCount >= 3) score += 10; // Strong intent
    
    return Math.min(score, 100);
  }

  /**
   * Calculate decision stage score (0-100)
   * Classifies: research (30), comparison (60), ready (90), actively seeking (100)
   * @param {string} text - Text to analyze
   * @param {object} analysis - Question analysis from QuestionDetector
   * @returns {object} - { score: number, stage: string }
   */
  calculateDecisionStageScore(text, analysis = null) {
    if (!text) return { score: 0, stage: 'unknown' };
    
    const analyzed = analysis || this.questionDetector.analyze(text);
    const lowerText = text.toLowerCase();
    
    // Actively seeking professional (100)
    if (analyzed.professionalSeeking.seekingProfessional) {
      if (/hire|looking for|need (a|an)|find (a|an)/i.test(text)) {
        return { score: 100, stage: 'actively_seeking_professional' };
      }
    }
    
    // Ready to act (90)
    if (analyzed.urgency.hasUrgency || analyzed.timeline.hasTimeline) {
      if (/ready to|want to start|need to (start|begin)|going to/i.test(text)) {
        return { score: 90, stage: 'ready_to_act' };
      }
    }
    
    // Comparison phase (60)
    if (/compare|vs|versus|better|best|which one|should i choose/i.test(text)) {
      return { score: 60, stage: 'comparison' };
    }
    
    // Research phase (30)
    if (/learn|understand|know more|explain|what is|how does/i.test(text)) {
      return { score: 30, stage: 'research' };
    }
    
    // Default based on question type
    if (analyzed.questionType === 'recommendation') {
      return { score: 70, stage: 'comparison' };
    } else if (analyzed.questionType === 'how-to') {
      return { score: 50, stage: 'research' };
    }
    
    return { score: 40, stage: 'general_inquiry' };
  }

  /**
   * Calculate help-seeking score (0-100)
   * Based on frequency of asking, engagement, and follow-ups
   * Note: This requires historical data, so we estimate from current text
   * @param {string} text - Text to analyze
   * @param {object} profile - Profile data (optional, for historical analysis)
   * @returns {number} - Score 0-100
   */
  calculateHelpSeekingScore(text, profile = null) {
    if (!text) return 0;
    
    const analyzed = this.questionDetector.analyze(text);
    
    let score = 0;
    
    // Is asking a question (+30)
    if (analyzed.isQuestion) {
      score += 30;
    }
    
    // Help-seeking language (+20)
    if (/need help|help me|can anyone help|struggling with/i.test(text)) {
      score += 20;
    }
    
    // Mentions failed attempts (+15)
    if (/tried|attempted|failed|didn't work|not working|stuck/i.test(text)) {
      score += 15;
    }
    
    // Detailed explanation of problem (+15)
    if (analyzed.textLength > 150) {
      score += 15;
    }
    
    // Polite/engaged language (+10)
    if (/please|thank|appreciate|grateful/i.test(text)) {
      score += 10;
    }
    
    // Follow-up indicators (+10)
    if (/also|additionally|another question|follow.?up/i.test(text)) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  /**
   * Calculate all intent scores for a piece of content
   * @param {string} text - Text to analyze
   * @param {object} profile - Profile data (optional)
   * @returns {object} - All scores and analysis
   */
  scoreContent(text, profile = null) {
    if (!text) {
      return {
        question_quality_score: 0,
        intent_score: 0,
        decision_stage_score: 0,
        decision_stage: 'unknown',
        help_seeking_score: 0,
        is_question: false,
        question_type: 'none'
      };
    }
    
    const analysis = this.questionDetector.analyze(text);
    const decisionStage = this.calculateDecisionStageScore(text, analysis);
    
    return {
      question_quality_score: this.calculateQuestionQualityScore(text, analysis),
      intent_score: this.calculateIntentScore(text, analysis),
      decision_stage_score: decisionStage.score,
      decision_stage: decisionStage.stage,
      help_seeking_score: this.calculateHelpSeekingScore(text, profile),
      is_question: analysis.isQuestion,
      question_type: analysis.questionType,
      question_text: text,
      urgency_indicators: analysis.urgency.indicators,
      budget_indicators: analysis.budget.indicators,
      timeline_indicators: analysis.timeline.indicators,
      professional_seeking_indicators: analysis.professionalSeeking.indicators
    };
  }
}

module.exports = IntentScorer;
