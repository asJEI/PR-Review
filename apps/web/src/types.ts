/**
 * Frontend types for PR Review Web UI
 */

export interface ReviewProgress {
  percent: number;
  phase?: string;
  message?: string;
}

export interface ReviewJobArtifacts {
  changedFiles: Array<{
    filename: string;
    status: string;
    patch: string | null;
    additions: number;
    deletions: number;
    previousFilename?: string;
  }>;
  fileRelevance: Array<{
    file: string;
    relevanceScore: number;
    priority: string;
  }>;
  resolvedProvider: string;
}

export interface ReviewStatus {
  ok: true;
  reviewId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: ReviewProgress;
  result?: ReviewResult;
  artifacts?: ReviewJobArtifacts;
  warnings?: string[];
  cached?: boolean;
  error?: string;
}

export interface CreateReviewRequest {
  prUrl: string;
  provider?: string;
  async?: boolean;
  skipCache?: boolean;
  forceMock?: boolean;
  options?: {
    strictOutput?: boolean;
    maxAgentRetries?: number;
  };
}

export interface CreateReviewResponse {
  ok: true;
  reviewId: string;
  status: 'queued' | 'completed';
  progress: ReviewProgress;
  result?: ReviewResult;
  artifacts?: ReviewJobArtifacts;
  warnings?: string[];
  cached?: boolean;
}

export interface ReviewResult {
  summary: PrSummary;
  risks: RiskReport;
  comments: CommentReport;
  meta: ReviewMeta;
}

export interface PrSummary {
  title: string;
  summary: string;
  keyChanges: string[];
  affectedSystems: string[];
  architecturalImpact: string;
  generatedAt?: string;
}

export interface RiskReport {
  risks: RiskItem[];
  overallRiskLevel?: string;
  generatedAt?: string;
  meta?: {
    filteredCount?: number;
    groundingWarnings?: string[];
  };
}

export interface RiskItem {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  affectedFiles: string[];
  recommendation: string;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;
  reasoning?: string;
}

export interface CommentReport {
  comments: ReviewComment[];
  generatedAt?: string;
  meta?: {
    filteredCount?: number;
    groundingWarnings?: string[];
  };
}

export interface ReviewComment {
  file: string;
  line?: number | null;
  symbol?: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'suggestion';
  comment: string;
  suggestion?: string;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;
  reasoning?: string;
  mapping?: {
    hunkIndex: number;
    startLine: number;
    endLine: number;
    changedLines: number[];
    side: 'LEFT' | 'RIGHT';
    githubPosition?: number;
    confidence: number;
  };
}

export interface ReviewMeta {
  provider: string;
  models: {
    summary: string;
    risk: string;
    comments: string;
  };
  latencyMs: {
    summary: number;
    risk: number;
    comments: number;
    total: number;
  };
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd?: number;
  };
  attempts: {
    summary: number;
    risk: number;
    comments: number;
  };
  reliabilityScore: number;
  groundingWarnings: string[];
  filteredCounts?: {
    risks: number;
    comments: number;
  };
}

export interface FileTreeItem {
  filename: string;
  status: 'modified' | 'added' | 'removed' | 'renamed';
  riskLevel?: 'critical' | 'high' | 'medium' | 'low';
  commentCount: number;
  relevanceScore?: number;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'context' | 'added' | 'removed';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface FileDiff {
  filename: string;
  status: 'modified' | 'added' | 'removed' | 'renamed';
  oldFile?: string;
  newFile?: string;
  hunks: DiffHunk[];
  comments: ReviewComment[];
}

export type ReviewPhase =
  | 'fetching'
  | 'building_context'
  | 'compressing'
  | 'scoring'
  | 'extracting_diffs'
  | 'building_prompts'
  | 'ai_review'
  | 'grounding'
  | 'completed';

export interface PhaseInfo {
  id: ReviewPhase;
  label: string;
  description: string;
}

export const REVIEW_PHASES: PhaseInfo[] = [
  { id: 'fetching', label: '获取 PR 数据', description: '从 GitHub 拉取 PR metadata、文件和 commit 信息' },
  { id: 'building_context', label: '构建上下文', description: '解析 diff 语义，构建工程上下文' },
  { id: 'compressing', label: '压缩上下文', description: '去除噪声，保留高信号语义' },
  { id: 'scoring', label: '相关性评分', description: '计算文件和代码片段的审查优先级' },
  { id: 'extracting_diffs', label: '提取 Focused Diff', description: '提取与审查相关的高价值代码变更' },
  { id: 'building_prompts', label: '构建 Prompts', description: '生成 Summary、Risk、Review 三类 Agent 输入' },
  { id: 'ai_review', label: 'AI Review', description: '并行执行 Summary 和 Risk 分析，然后生成 Review Comments' },
  { id: 'grounding', label: 'Grounding', description: '行号映射、置信度评分、可靠性聚合' },
];

export type ConfidenceLabel = 'high' | 'medium' | 'low';

export function confidenceLabelToScore(label: ConfidenceLabel | string | undefined): number {
  if (label === 'high') return 0.9;
  if (label === 'medium') return 0.7;
  if (label === 'low') return 0.5;
  return 0;
}

export function formatConfidencePercent(score: number | undefined, label?: string): string {
  if (typeof score === 'number' && Number.isFinite(score)) {
    const normalized = score <= 1 ? score * 100 : score;
    return `${Math.round(normalized)}%`;
  }
  if (label) {
    return `${Math.round(confidenceLabelToScore(label) * 100)}%`;
  }
  return '—';
}

export function mapFileStatus(status: string): FileTreeItem['status'] {
  if (status === 'added' || status === 'removed' || status === 'renamed') {
    return status;
  }
  return 'modified';
}
