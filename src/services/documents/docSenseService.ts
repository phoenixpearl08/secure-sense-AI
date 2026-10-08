// DocSenseAI - Intelligent Document Intelligence & Grounded Q&A Engine
// Extracts structured insights, contractual obligations, financial terms, and provides source-grounded Q&A.

import { DocumentChunk, DocumentInsight, AskAnswer } from '@/types';

/**
 * Splits document text into page-aware chunks preserving page numbers and section headers
 */
export function chunkDocumentText(text: string): DocumentChunk[] {
  // Check if text has explicit page delimiters (e.g., [Page 1], --- Page 2 ---, etc.)
  const pageRegex = /(?:\[Page\s*(\d+)\]|---\s*Page\s*(\d+)\s*---|={3,}\s*Page\s*(\d+)\s*={3,})/i;
  const rawParts = text.split(pageRegex);

  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  if (rawParts.length > 1) {
    let currentPage = 1;
    for (let i = 0; i < rawParts.length; i++) {
      const part = rawParts[i]?.trim();
      if (!part) continue;

      if (/^\d+$/.test(part)) {
        currentPage = parseInt(part, 10);
      } else {
        chunks.push({
          id: `chunk-${chunkIndex}`,
          documentId: '',
          chunkIndex,
          pageNumber: currentPage,
          content: part,
        });
        chunkIndex++;
      }
    }
  } else {
    // Split into simulated pages / chunks of ~800 characters
    const paragraphs = text.split(/\n\s*\n/);
    let currentPage = 1;
    let currentBuffer = '';

    for (const para of paragraphs) {
      if ((currentBuffer + para).length > 800) {
        if (currentBuffer.trim()) {
          chunks.push({
            id: `chunk-${chunkIndex}`,
            documentId: '',
            chunkIndex,
            pageNumber: currentPage,
            content: currentBuffer.trim(),
          });
          chunkIndex++;
          currentPage++;
          currentBuffer = '';
        }
      }
      currentBuffer += `${para}\n\n`;
    }

    if (currentBuffer.trim()) {
      chunks.push({
        id: `chunk-${chunkIndex}`,
        documentId: '',
        chunkIndex,
        pageNumber: currentPage,
        content: currentBuffer.trim(),
      });
    }
  }

  return chunks.length > 0 ? chunks : [{ id: 'chunk-0', documentId: '', chunkIndex: 0, pageNumber: 1, content: text }];
}

/**
 * Extracts structured intelligence, obligations, deadlines, and financial values
 */
export function analyzeDocumentContent(chunks: DocumentChunk[]): DocumentInsight[] {
  const insights: DocumentInsight[] = [];

  // 1. Executive Summary
  const firstChunk = chunks[0]?.content || '';
  const firstSentences = firstChunk.split(/(?<=[.?!])\s+/).slice(0, 3).join(' ');
  insights.push({
    id: `insight-summary`,
    documentId: '',
    category: 'SUMMARY',
    title: 'Executive Overview',
    description: firstSentences || 'Comprehensive contractual agreement containing legal provisions and obligations.',
    pageNumber: chunks[0]?.pageNumber || 1,
    sectionRef: 'Section 1.0 Overview',
    confidence: 0.95,
  });

  // 2. Financial Terms Detection
  const financialRegex = /(?:(\$|USD|EUR|INR|Rs\.?|GBP)\s*([\d,]+(?:\.\d{2})?)|([\d,]+(?:\.\d{2})?)\s*(?:dollars|euros|rupees))/gi;
  for (const chunk of chunks) {
    const matches = Array.from(chunk.content.matchAll(financialRegex));
    for (const match of matches) {
      const sentence = chunk.content.split(/(?<=[.?!])\s+/).find((s) => s.includes(match[0])) || match[0];
      insights.push({
        id: `insight-fin-${insights.length}`,
        documentId: '',
        category: 'FINANCIAL',
        title: `Financial Value: ${match[0]}`,
        description: sentence.trim(),
        pageNumber: chunk.pageNumber,
        sectionRef: `Payment Provisions (Page ${chunk.pageNumber})`,
        confidence: 0.98,
      });
      break; // Keep cleanest
    }
    if (insights.some((i) => i.category === 'FINANCIAL')) break;
  }

  // 3. Deadlines & Critical Dates
  const deadlineTerms = ['deadline', 'expiration', 'effective date', 'due date', 'terminate', 'within 30 days', 'before', 'prior to'];
  for (const chunk of chunks) {
    const lower = chunk.content.toLowerCase();
    for (const term of deadlineTerms) {
      if (lower.includes(term)) {
        const sentence = chunk.content.split(/(?<=[.?!])\s+/).find((s) => s.toLowerCase().includes(term));
        if (sentence) {
          insights.push({
            id: `insight-dl-${insights.length}`,
            documentId: '',
            category: 'DEADLINE',
            title: `Critical Timeline: ${term.toUpperCase()}`,
            description: sentence.trim(),
            pageNumber: chunk.pageNumber,
            sectionRef: `Terms & Schedule (Page ${chunk.pageNumber})`,
            confidence: 0.92,
          });
          break;
        }
      }
    }
    if (insights.some((i) => i.category === 'DEADLINE')) break;
  }

  // 4. Contractual Obligations
  const obligationTerms = ['shall', 'must', 'agrees to', 'covenants', 'warrants', 'strictly liable', 'responsible for'];
  for (const chunk of chunks) {
    const lower = chunk.content.toLowerCase();
    for (const term of obligationTerms) {
      if (lower.includes(term)) {
        const sentence = chunk.content.split(/(?<=[.?!])\s+/).find((s) => s.toLowerCase().includes(term));
        if (sentence) {
          insights.push({
            id: `insight-ob-${insights.length}`,
            documentId: '',
            category: 'OBLIGATION',
            title: 'Enforceable Obligation',
            description: sentence.trim(),
            pageNumber: chunk.pageNumber,
            sectionRef: `Covenants & Responsibilities (Page ${chunk.pageNumber})`,
            confidence: 0.94,
          });
          break;
        }
      }
    }
    if (insights.some((i) => i.category === 'OBLIGATION')) break;
  }

  // 5. Confidentiality & Security Risks
  const riskTerms = ['confidential', 'proprietary', 'trade secret', 'non-disclosure', 'indemnity', 'penalty'];
  for (const chunk of chunks) {
    const lower = chunk.content.toLowerCase();
    for (const term of riskTerms) {
      if (lower.includes(term)) {
        insights.push({
          id: `insight-risk-${insights.length}`,
          documentId: '',
          category: 'RISK',
          title: `Sensitive Asset Flag: ${term.toUpperCase()}`,
          description: `Identified restricted terms requiring RealityVault protection: "${term}".`,
          pageNumber: chunk.pageNumber,
          sectionRef: `Confidentiality & Liability (Page ${chunk.pageNumber})`,
          confidence: 0.96,
        });
        break;
      }
    }
    if (insights.some((i) => i.category === 'RISK')) break;
  }

  return insights;
}

/**
 * Ask Your Document (Grounded Q&A Engine)
 * Finds relevant chunks, answers the user's question with citations, or returns "Not found in the provided document."
 */
export function askDocument(question: string, chunks: DocumentChunk[]): AskAnswer {
  const cleanQ = question.toLowerCase().trim();

  // Prompt-Injection Defense: Block attempts to manipulate system boundaries
  const injectionPatterns = [
    'ignore all security',
    'ignore previous instructions',
    'system prompt',
    'bypass security',
    'bypass policy',
    'grant admin',
    'reveal master key',
    'output secret key',
  ];
  if (injectionPatterns.some((pattern) => cleanQ.includes(pattern))) {
    return {
      question,
      answer: 'Blocked: System security rules and access policies cannot be overridden through document queries.',
      grounded: false,
      confidence: 1.0,
    };
  }

  const keywords = cleanQ
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['what', 'when', 'where', 'which', 'who', 'how', 'the', 'and', 'for', 'is', 'are'].includes(w));

  if (keywords.length === 0) {
    return {
      question,
      answer: 'Please provide a more specific question regarding the document contents.',
      grounded: false,
      confidence: 0.0,
    };
  }

  let bestChunk: DocumentChunk | null = null;
  let highestScore = 0;
  let matchingSentence = '';

  for (const chunk of chunks) {
    const textLower = chunk.content.toLowerCase();
    let score = 0;

    for (const kw of keywords) {
      if (textLower.includes(kw)) {
        score += 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestChunk = chunk;

      // Find best sentence inside chunk
      const sentences = chunk.content.split(/(?<=[.?!])\s+/);
      let bestSentScore = 0;
      for (const sent of sentences) {
        const sentLower = sent.toLowerCase();
        let sScore = 0;
        for (const kw of keywords) {
          if (sentLower.includes(kw)) sScore++;
        }
        if (sScore > bestSentScore) {
          bestSentScore = sScore;
          matchingSentence = sent.trim();
        }
      }
    }
  }

  // If match confidence is too low or not found
  if (!bestChunk || highestScore === 0) {
    return {
      question,
      answer: 'Not found in the provided document.',
      grounded: false,
      confidence: 0.0,
    };
  }

  return {
    question,
    answer: matchingSentence || bestChunk.content.slice(0, 300),
    grounded: true,
    pageNumber: bestChunk.pageNumber,
    sectionRef: `Page ${bestChunk.pageNumber}`,
    confidence: Math.min(0.6 + highestScore * 0.1, 0.99),
    relevantExcerpt: matchingSentence || bestChunk.content.slice(0, 200),
  };
}

/**
 * Evaluates document sensitivity and recommends automated RealityVault security profile
 */
export function classifyDocumentSecurity(
  chunks: DocumentChunk[],
  insights: DocumentInsight[]
): import('@/types').DocumentSecurityClassification {
  const riskFactors: string[] = [];
  let score = 20; // baseline

  const hasFinancial = insights.some((i) => i.category === 'FINANCIAL');
  const hasObligations = insights.some((i) => i.category === 'OBLIGATION');
  const hasRisks = insights.some((i) => i.category === 'RISK');
  const fullText = chunks.map((c) => c.content).join(' ').toLowerCase();

  if (hasFinancial) {
    score += 30;
    riskFactors.push('High-value financial considerations detected');
  }

  if (hasObligations) {
    score += 20;
    riskFactors.push('Legally binding covenants and performance obligations');
  }

  if (hasRisks || fullText.includes('confidential') || fullText.includes('secret') || fullText.includes('nda')) {
    score += 25;
    riskFactors.push('Confidentiality restrictions and non-disclosure clauses');
  }

  if (fullText.includes('ssn') || fullText.includes('passport') || fullText.includes('salary') || fullText.includes('identity')) {
    score += 20;
    riskFactors.push('Potential Personally Identifiable Information (PII) identified');
  }

  let sensitivity: import('@/types').RiskLevel = 'LOW';
  let recommendedSecurityLevel: import('@/types').SecurityLevel = 'STANDARD';

  if (score >= 80) {
    sensitivity = 'CRITICAL';
    recommendedSecurityLevel = 'CRITICAL';
  } else if (score >= 50) {
    sensitivity = 'HIGH';
    recommendedSecurityLevel = 'HIGH_SECURITY';
  } else if (score >= 35) {
    sensitivity = 'MEDIUM';
    recommendedSecurityLevel = 'CONFIDENTIAL';
  }

  const finalRiskScore = Math.min(score, 100);
  const detectedIndicators = riskFactors.length > 0 ? riskFactors : ['Standard business document'];
  const justification = `DocSenseAI evaluated sensitivity at ${sensitivity} (Score: ${finalRiskScore}/100). Recommended Vault Protection: ${recommendedSecurityLevel} with authenticated encryption and controlled OTP verification.`;

  return {
    sensitivity,
    recommendedSecurityLevel,
    riskScore: finalRiskScore,
    riskFactors: detectedIndicators,
    recommendationExplanation: justification,
    sensitivityLevel: sensitivity,
    recommendedVaultPolicy: recommendedSecurityLevel,
    overallRiskScore: finalRiskScore,
    detectedIndicators,
    justification,
  };
}

