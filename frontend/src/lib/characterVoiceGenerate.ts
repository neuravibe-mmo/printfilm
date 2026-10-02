/** Đặt AI để tạo âm thanh theo vai trò và liên kết chúng với voiceAudio (không có cửa sổ bật lên, tạo thẻ chỉ bằng một cú nhấp chuột) */
import { dramaApi, type DramaAsset } from '../api/drama'
import { buildBoundParams } from '../pages/drama/CharacterVoiceBindModal'

export type CharacterVoiceGenerateResult = {
  character: DramaAsset
  voice: DramaAsset
}

// Tạo mô tả âm sắc dựa trên nội dung nhân vật, tổng hợp phần thử giọng và viết lại ràng buộc
export async function generateAndBindCharacterVoice(
  projectId: number,
  asset: DramaAsset,
): Promise<CharacterVoiceGenerateResult> {
  const promptResult = await dramaApi.suggestVoicePrompt({
    project_id: projectId,
    asset_id: asset.id,
  })
  const voicePrompt = (promptResult.voice_prompt || '').trim()
  if (!voicePrompt) {
    throw new Error('音色描述为空')
  }

  const voiceResult = await dramaApi.generateVoice({
    project_id: projectId,
    name: `${asset.name || '角色'}音色`,
    voice_prompt: voicePrompt,
    speaker: promptResult.speaker || undefined,
    sample_text: promptResult.sample_text || undefined,
    character_asset_id: asset.id,
  })
  const voice = voiceResult.asset
  if (!voice?.url) {
    throw new Error('音色合成失败')
  }

  const character = await dramaApi.updateAsset(asset.id, {
    params: buildBoundParams(asset, voice),
  })
  return { character, voice }
}
