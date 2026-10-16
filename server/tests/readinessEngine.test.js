import { calculateReadinessScore, FACTOR_DEFINITIONS } from '../src/services/readinessService.js';

describe('Exam Readiness Score Engine (0-100)', () => {
  test('computes correct overall score when all 7 factors are provided', () => {
    const inputs = {
      syllabusCompletion: 80, // 20% weight -> contribution = 16
      topicMastery: 70,        // 20% weight -> contribution = 14
      mockPerformance: 75,     // 20% weight -> contribution = 15
      accuracy: 80,            // 15% weight -> contribution = 12
      revisionConsistency: 60, // 10% weight -> contribution = 6
      studyConsistency: 90,    // 10% weight -> contribution = 9
      pyqPerformance: 100,     // 5% weight  -> contribution = 5
    }; // Expected overall score = 16 + 14 + 15 + 12 + 6 + 9 + 5 = 77.0

    const result = calculateReadinessScore(inputs);

    expect(result.overallScore).toBe(77.0);
    expect(result.confidenceLevel).toBe('HIGH');
    expect(result.explanationMetadata.availableFactorsCount).toBe(7);
    expect(result.explanationMetadata.missingFactors).toHaveLength(0);

    for (const [key, def] of Object.entries(FACTOR_DEFINITIONS)) {
      expect(result.componentScores[key].status).toBe('available');
      expect(result.componentScores[key].score).toBe(inputs[key]);
      expect(result.componentScores[key].defaultWeight).toBe(def.defaultWeight);
      expect(result.componentScores[key].normalizedWeight).toBe(def.defaultWeight);
    }
  });

  test('redistributes weights proportionally when some factors are missing', () => {
    const inputs = {
      syllabusCompletion: 100, // weight 0.20
      topicMastery: 80,        // weight 0.20
      mockPerformance: null,   // missing (weight 0.20)
      accuracy: 80,            // weight 0.15
      revisionConsistency: null,// missing (weight 0.10)
      studyConsistency: 50,    // weight 0.10
      pyqPerformance: 60,      // weight 0.05
    };
    // Available weights sum = 0.20 + 0.20 + 0.15 + 0.10 + 0.05 = 0.70
    // Normalized weights:
    // syllabusCompletion: 0.20 / 0.70 = 2/7 -> 100 * (2/7) = 28.5714
    // topicMastery: 0.20 / 0.70 = 2/7 -> 80 * (2/7) = 22.8571
    // accuracy: 0.15 / 0.70 = 1.5/7 -> 80 * (1.5/7) = 17.1428
    // studyConsistency: 0.10 / 0.70 = 1/7 -> 50 * (1/7) = 7.1428
    // pyqPerformance: 0.05 / 0.70 = 0.5/7 -> 60 * (0.5/7) = 4.2857
    // Expected Sum = 80.0

    const result = calculateReadinessScore(inputs);

    expect(result.overallScore).toBe(80.0);
    expect(result.confidenceLevel).toBe('HIGH');
    expect(result.explanationMetadata.availableFactorsCount).toBe(5);
    expect(result.explanationMetadata.missingFactors).toEqual(['mockPerformance', 'revisionConsistency']);

    expect(result.componentScores.mockPerformance.status).toBe('missing');
    expect(result.componentScores.mockPerformance.normalizedWeight).toBe(0);
    expect(result.componentScores.syllabusCompletion.status).toBe('available');
    expect(result.componentScores.syllabusCompletion.normalizedWeight).toBeCloseTo(0.286, 2);
  });

  test('handles 0% score across all factors without error', () => {
    const inputs = {
      syllabusCompletion: 0,
      topicMastery: 0,
      mockPerformance: 0,
      accuracy: 0,
      revisionConsistency: 0,
      studyConsistency: 0,
      pyqPerformance: 0,
    };

    const result = calculateReadinessScore(inputs);

    expect(result.overallScore).toBe(0);
    expect(result.confidenceLevel).toBe('HIGH');
    expect(result.explanationMetadata.availableFactorsCount).toBe(7);
  });

  test('handles 100% score across all factors', () => {
    const inputs = {
      syllabusCompletion: 100,
      topicMastery: 100,
      mockPerformance: 100,
      accuracy: 100,
      revisionConsistency: 100,
      studyConsistency: 100,
      pyqPerformance: 100,
    };

    const result = calculateReadinessScore(inputs);

    expect(result.overallScore).toBe(100.0);
  });

  test('handles completely empty inputs gracefully', () => {
    const result = calculateReadinessScore({});

    expect(result.overallScore).toBe(0);
    expect(result.confidenceLevel).toBe('NONE');
    expect(result.explanationMetadata.availableFactorsCount).toBe(0);
    expect(result.explanationMetadata.missingFactors).toHaveLength(7);
  });

  test('clamps out-of-bounds input values to [0, 100]', () => {
    const inputs = {
      syllabusCompletion: 150, // should clamp to 100
      topicMastery: -20,       // should clamp to 0
    };

    const result = calculateReadinessScore(inputs);

    expect(result.componentScores.syllabusCompletion.score).toBe(100);
    expect(result.componentScores.topicMastery.score).toBe(0);
  });
});
