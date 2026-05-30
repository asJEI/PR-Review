import type { ReviewStatus } from '@/types';

export type DemoPresetTagColor = 'blue' | 'orange' | 'purple';

export interface DemoPresetMeta {
  id: string;
  prUrl: string;
  title: string;
  category: string;
  description: string;
  tagColor: DemoPresetTagColor;
}

export interface DemoPresetData extends DemoPresetMeta {
  generatedAt: string;
  review: ReviewStatus;
}

export const DEMO_PRESETS: DemoPresetMeta[] = [
  {
    id: 'xiangshan-hpm',
    prUrl: 'https://github.com/OpenXiangShan/XiangShan-Design-Doc/pull/136',
    title: 'fix(HPM.md): fix PMU register names and bit field offsets',
    category: '文档/规格修正',
    description: '修复 PMU 文档中寄存器名称与位域偏移笔误，涉及 mhpmevent 与 mcountinhibit/xcounteren 描述。',
    tagColor: 'blue',
  },
  {
    id: 'naga-agent-auth',
    prUrl: 'https://github.com/RTGS2017/NagaAgent/pull/313',
    title: 'feat(frontend): 网关/本地模式配置 UI 与登录跳过 emit',
    category: '认证权限相关',
    description: '登录跳过 emit、网关/本地模式配置 UI、敏感字段 password 输入与 Windows UTF-8 日志修复。',
    tagColor: 'orange',
  },
  {
    id: 'vite-monorepo-refactor',
    prUrl: 'https://github.com/netease-youdao/LobsterAI/pull/944',
    title: 'fix(mcp): fix scrollbar overflowing modal rounded corners',
    category: '大型重构相关',
    description: '修复 MCP 自定义服务器弹框滚动条溢出圆角问题，拆分外层裁剪、内容滚动与底部按钮三层结构。',
    tagColor: 'purple',
  },
];

export function isDemoReviewId(reviewId: string): boolean {
  return reviewId.startsWith('demo-');
}

export function demoReviewId(presetId: string): string {
  return `demo-${presetId}`;
}

export function presetIdFromReviewId(reviewId: string): string | null {
  if (!isDemoReviewId(reviewId)) {
    return null;
  }
  return reviewId.slice('demo-'.length);
}

export function findDemoPresetMeta(presetId: string): DemoPresetMeta | undefined {
  return DEMO_PRESETS.find((preset) => preset.id === presetId);
}
