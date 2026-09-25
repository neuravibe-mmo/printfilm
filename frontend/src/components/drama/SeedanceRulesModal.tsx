/** Seedance 传值与脚本规则说明弹窗（分集编辑页，对齐 docs/EPISODE_RULES.md） */
import { useState } from 'react'
import Modal from '../ui/Modal'
import {
  DRAMA_SEGMENT_DURATION_MAX,
  DRAMA_SEGMENT_DURATION_MIN,
  DRAMA_SHOT_DURATION_HARD_MAX,
  FRAGMENT_CONTENT_DURATION_MAX,
} from '../../lib/dramaEpisodePromptEditor'
import {
  DIALOGUE_PREFIX,
  DRAMA_NARRATION_PREFIX,
  DRAMA_SUBTITLE_CUE,
  VISUAL_PREFIX,
} from '../../lib/dramaEpisodeScriptValidate'
import { useI18n } from '../../i18n'

type Tab = 'payload' | 'script' | 'usage'

type Props = {
  open: boolean
  onClose: () => void
}

export function SeedanceRulesModal({ open, onClose }: Props) {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('payload')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('drama.seedanceRules.title')}
      size="lg"
      className="pf-help-modal seedance-rules-modal"
      footer={
        <button type="button" className="pf-btn pf-btn-lime pf-btn-sm" onClick={onClose}>
          {t('dialog.ok')}
        </button>
      }
    >
      <div className="pf-help">
        <p className="pf-help-lede">
          {t('drama.seedanceRules.lede1')}{' '}
          <code>docs/EPISODE_RULES.md</code>
          {t('drama.seedanceRules.lede2')}
        </p>

        <div className="pf-help-tabs" role="tablist" aria-label={t('drama.seedanceRules.tabsAria')}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'payload'}
            className={tab === 'payload' ? 'active' : undefined}
            onClick={() => setTab('payload')}
          >
            {t('drama.seedanceRules.tabPayload')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'script'}
            className={tab === 'script' ? 'active' : undefined}
            onClick={() => setTab('script')}
          >
            {t('drama.seedanceRules.tabScript')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'usage'}
            className={tab === 'usage' ? 'active' : undefined}
            onClick={() => setTab('usage')}
          >
            {t('drama.seedanceRules.tabUsage')}
          </button>
        </div>

        {tab === 'payload' ? (
          <div className="seedance-rules-section">
            <h4>{t('drama.seedanceRules.payloadH1')}</h4>
            <ul className="seedance-rules-list">
              <li>
                <strong>{t('drama.seedanceRules.fieldModel')}</strong> → <code>model</code>{t('drama.seedanceRules.fieldModelNote')}
              </li>
              <li>
                <strong>{t('drama.seedanceRules.fieldRatio')}</strong>{t('drama.seedanceRules.fieldRatioNote')} → <code>ratio</code>、<code>resolution</code>
              </li>
              <li>
                <strong>{t('drama.seedanceRules.fieldDuration')}</strong> → <code>duration</code>：{t('drama.seedanceRules.fieldDurationNote1')}{' '}
                <code>@duration</code> {t('drama.seedanceRules.fieldDurationNote2').replace('{max}', String(FRAGMENT_CONTENT_DURATION_MAX))}
              </li>
              <li>
                <strong>{t('drama.seedanceRules.fieldStyle')}</strong> → {t('drama.seedanceRules.fieldStyleNote')}
              </li>
            </ul>

            <h4>{t('drama.seedanceRules.payloadH2')}</h4>
            <ol className="seedance-rules-list">
              <li>
                <strong>text</strong>：{t('drama.seedanceRules.contentText')}
              </li>
              <li>
                <strong>reference_image</strong>：{t('drama.seedanceRules.contentRefImg')}
              </li>
            </ol>
            <p className="seedance-rules-note">
              {t('drama.seedanceRules.generateAudioNote')}
            </p>

            <h4>{t('drama.seedanceRules.payloadH3')}</h4>
            <ol className="seedance-rules-list">
              <li>{t('drama.seedanceRules.promptOrder1')}</li>
              <li>{t('drama.seedanceRules.promptOrder2')}</li>
              <li>{t('drama.seedanceRules.promptOrder3')}</li>
              <li>{t('drama.seedanceRules.promptOrder4')}</li>
              <li>{t('drama.seedanceRules.promptOrder5')}</li>
              <li>
                {t('drama.seedanceRules.promptOrder6')}
              </li>
            </ol>
          </div>
        ) : null}

        {tab === 'script' ? (
          <div className="seedance-rules-section">
            <h4>{t('drama.seedanceRules.scriptH1')}</h4>
            <ul className="seedance-rules-list">
              <li>
                <code>@duration:N</code>：{t('drama.seedanceRules.durationTagDesc')
                  .replace('{min}', String(DRAMA_SEGMENT_DURATION_MIN))
                  .replace('{max}', String(DRAMA_SEGMENT_DURATION_MAX))}
              </li>
              <li>
                {t('drama.seedanceRules.durationLimit')
                  .replace('{fragMax}', String(FRAGMENT_CONTENT_DURATION_MAX))
                  .replace('{hardMax}', String(DRAMA_SHOT_DURATION_HARD_MAX))}
              </li>
              <li>{t('drama.seedanceRules.atHint')}</li>
            </ul>

            <h4>{t('drama.seedanceRules.scriptH2')}</h4>
            <ul className="seedance-rules-list">
              <li>
                <code>@asset:123</code>：{t('drama.seedanceRules.assetRefDesc')}
              </li>
              <li>{t('drama.seedanceRules.assetPanelHint')}</li>
              <li>{t('drama.seedanceRules.assetVoiceHint')}</li>
            </ul>

            <h4>{t('drama.seedanceRules.scriptH3')}</h4>
            <div className="seedance-rules-examples">
              <code>{DRAMA_SUBTITLE_CUE}</code>
              <code>{t('drama.seedanceRules.bgmExample')}</code>
              <code>@duration:4</code>
              <code>{VISUAL_PREFIX}{t('drama.seedanceRules.visualExample')}</code>
              <code>@duration:6</code>
              <code>{DIALOGUE_PREFIX}{t('drama.seedanceRules.dialogueExample')}</code>
              <code>{DRAMA_NARRATION_PREFIX}{t('drama.seedanceRules.narrationExample')}</code>
            </div>
            <ul className="seedance-rules-list">
              <li>
                <strong>{t('drama.seedanceRules.visualLabel')}</strong>：{t('drama.seedanceRules.visualDesc').replace('{prefix}', VISUAL_PREFIX)}
              </li>
              <li>
                <strong>{t('drama.seedanceRules.dialogueLabel')}</strong>：<code>{t('drama.seedanceRules.dialogueSyntax')}</code> {t('drama.seedanceRules.dialogueOr')} {DIALOGUE_PREFIX}
              </li>
              <li>
                <strong>{t('drama.seedanceRules.narrationLabel')}</strong>：{DRAMA_NARRATION_PREFIX}；{t('drama.seedanceRules.narrationDesc')}
              </li>
              <li>
                <strong>{t('drama.seedanceRules.introLabel')}</strong>：{t('drama.seedanceRules.introDesc')}
              </li>
              <li>
                <strong>BGM</strong>：{t('drama.seedanceRules.bgmDesc')}
              </li>
            </ul>

            <h4>{t('drama.seedanceRules.shotH')}</h4>
            <ul className="seedance-rules-list">
              <li>{t('drama.seedanceRules.shotHint1')}</li>
              <li>{t('drama.seedanceRules.shotHint2')}</li>
              <li>{t('drama.seedanceRules.shotHint3')}</li>
            </ul>
          </div>
        ) : null}

        {tab === 'usage' ? (
          <div className="seedance-rules-section">
            <h4>{t('drama.seedanceRules.usageH1')}</h4>
            <ul className="seedance-rules-list">
              <li>{t('drama.seedanceRules.usageCheck1')}</li>
              <li>{t('drama.seedanceRules.usageCheck2')}</li>
              <li>{t('drama.seedanceRules.usageCheck3')}</li>
            </ul>

            <h4>{t('drama.seedanceRules.usageH2')}</h4>
            <ul className="seedance-rules-list">
              <li>{t('drama.seedanceRules.queueNote1')}</li>
              <li>{t('drama.seedanceRules.queueNote2')}</li>
              <li>{t('drama.seedanceRules.queueNote3')}</li>
            </ul>

            <h4>{t('drama.seedanceRules.usageH3')}</h4>
            <ul className="seedance-rules-list">
              <li>
                {t('drama.seedanceRules.linkNote1')} <code>params.lastFrameUrl</code>
              </li>
              <li>
                {t('drama.seedanceRules.linkNote2')} <code>reference_image</code>{t('drama.seedanceRules.linkNote2b')} <code>first_frame</code>
              </li>
              <li>{t('drama.seedanceRules.linkNote3')}</li>
            </ul>

            <h4>{t('drama.seedanceRules.usageH4')}</h4>
            <ul className="seedance-rules-list">
              <li>{t('drama.seedanceRules.audioNote1')}</li>
              <li>{t('drama.seedanceRules.audioNote2')}</li>
            </ul>

            <h4>{t('drama.seedanceRules.usageH5')}</h4>
            <p className="seedance-rules-note">
              {t('drama.seedanceRules.replanNote')}
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
