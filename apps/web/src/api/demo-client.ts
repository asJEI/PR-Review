import type { DemoPresetData } from '@/data/demo-presets';

export class DemoPresetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DemoPresetError';
  }
}

export async function loadDemoPreset(presetId: string): Promise<DemoPresetData> {
  const response = await fetch(`/demos/${presetId}.json`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new DemoPresetError(`预设演示数据不存在: ${presetId}`);
    }
    throw new DemoPresetError(`加载预设演示失败 (HTTP ${response.status})`);
  }

  const data = (await response.json()) as DemoPresetData;

  if (!data.review || data.review.status !== 'completed') {
    throw new DemoPresetError(`预设演示数据不完整: ${presetId}`);
  }

  return data;
}
