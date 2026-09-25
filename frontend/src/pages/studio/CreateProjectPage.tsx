import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../i18n'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, defaultsFromTemplate } from '../../api'
import type { Template } from '../../api'
import BillingErrorNotice from '../../components/billing/BillingErrorNotice'
import AppShell from '../../components/layout/AppShell'
import Stepper from '../../components/ui/Stepper'
import PillTabs from '../../components/ui/PillTabs'
import { IconChevronLeft, IconRefresh, IconSparkles } from '../../components/ui/Icons'
import { CATEGORY_ORDER } from '../../lib/categories'
import { kepuStepIndex, kepuSteps } from '../../lib/status'

type Inspiration = {
  title: string
  theme: string
  script: string
}

const INSPIRATION_POOL: Inspiration[] = [
  {
    title: 'Cách quay check-in quán',
    theme: 'Biến điểm mạnh của một quán local thành video viral TikTok: 3 giây hook, cảnh quán, 1-2 trải nghiệm thực tế, lời kêu gọi đến quán. Chỉ viết những gì đã biết.',
    script:
      'Đi qua con đường này chục lần, lần này mới bước vào.\n\n' +
      'Quán nhỏ nhưng biển hiệu rõ ràng, ngay gần ga metro.\n\n' +
      'Tôi gọi món chủ lực của quán, cảm nhận thật lòng: vị chuẩn, lên đồ nhanh.\n\n' +
      'Muốn thử thì tự xem menu, đừng nghe những lời hứa cường điệu.',
  },
  {
    title: 'Review kiểu bạn thân giới thiệu',
    theme: 'Video review kiểu Xiaohongshu: tiêu đề hook, ấn tượng đầu tiên, trải nghiệm cụ thể từng điểm, phù hợp ai. Chỉ nêu điểm mạnh khách quan.',
    script:
      'Ban đầu chỉ định đi qua, cuối cùng ngồi trong quán mãi.\n\n' +
      'Ấn tượng đầu là ánh sáng sạch, ghế ngồi không chật.\n\n' +
      'Tôi gọi món signature, khẩu phần thật lòng mà nói; không gian yên tĩnh, thích hợp nói chuyện.\n\n' +
      'Hợp với người muốn ngồi lâu; ai vội thì xem menu trước rồi tính.',
  },
  {
    title: 'Phân tích review để quyết định',
    theme: 'Video review kiểu phân tích: đánh giá tổng thể, không gian & phục vụ, món gợi ý kèm lý do, giá trị tiền, phù hợp ai. Giá không biết thì không đoán.',
    script:
      'Tổng thể: sạch, quy trình rõ ràng, phù hợp người lần đầu đến.\n\n' +
      'Không gian thoáng, nhân viên chủ động hướng dẫn chọn đồ.\n\n' +
      'Gợi ý món chủ lực vì tôi đã dùng thử, quy trình dễ hiểu.\n\n' +
      'Giá theo niêm yết tại quán. Đi theo nhóm phù hợp hơn đi một mình.',
  },
  {
    title: 'Giới thiệu nhẹ trong nhóm bạn',
    theme: 'Video ngắn cho mạng xã hội: một câu cảm nhận thật, một chi tiết cụ thể, một lời giới thiệu nhẹ. Kiềm chế, không giống quảng cáo.',
    script:
      'Hôm nay ghé qua tiện đường, ngồi một lúc, yên hơn tưởng.\n\n' +
      'Bàn cạnh cửa sổ có nắng tự nhiên, thích hợp nghỉ chân.\n\n' +
      'Bạn nào gần đây thì tự ghé xem thử nhé.',
  },
  {
    title: 'Lỗ đen hình thành như thế nào',
    theme: 'Lỗ đen hình thành như thế nào? Giải thích dễ hiểu về sự sụp đổ của ngôi sao, chân trời sự kiện và cong không-thời gian, dành cho học sinh cấp 3.',
    script:
      'Một trong những thiên thể bí ẩn nhất bầu đêm, đó là lỗ đen.\n\n' +
      'Khi một ngôi sao đủ lớn cạn kiệt nhiên liệu, lõi sẽ sụp đổ dữ dội dưới trọng lực, mật độ cao đến mức ánh sáng cũng không thoát được — chân trời sự kiện ra đời.\n\n' +
      'Nó không phải máy hút bụi vũ trụ, mà là vùng không-thời gian bị bẻ cong nghiêm trọng. Đến gần đó, thời gian trôi cũng trở nên kỳ lạ.\n\n' +
      'Nhớ nhé: khối lượng đủ lớn, sụp đổ đủ mạnh — lỗ đen xuất hiện.',
  },
  {
    title: 'Tại sao bầu trời lại xanh',
    theme: 'Tại sao bầu trời màu xanh? Dùng tán xạ Rayleigh giải thích ánh sáng mặt trời, phân tử không khí và ráng chiều, phù hợp cho người mới tìm hiểu khoa học.',
    script:
      'Nhìn lên, ban ngày bầu trời thường xanh — có phải ngẫu nhiên không?\n\n' +
      'Ánh nắng trông trắng nhưng thực ra chứa nhiều màu. Các phân tử không khí tán xạ ánh sáng xanh mạnh hơn, xanh dễ bị "bắn" ra bốn phía hơn, nên mắt ta thấy bầu trời xanh.\n\n' +
      'Sáng sớm và chiều tà, mặt trời thấp, ánh sáng xuyên qua tầng khí quyển dày hơn, xanh tán hết, còn lại đỏ cam nhuộm đỏ chân trời.\n\n' +
      'Màu sắc của bầu trời là sự hợp tác giữa ánh sáng và không khí.',
  },
  {
    title: 'AI thay đổi cuộc sống như thế nào',
    theme: 'AI thay đổi cuộc sống: từ gợi ý, trợ lý giọng nói đến hình ảnh y tế, giải thích sự tiện lợi và những thành kiến cần cảnh giác.',
    script:
      'Mở điện thoại lên, video gợi ý, chỉ đường, trợ lý giọng nói — AI đã lặng lẽ len vào cuộc sống hàng ngày.\n\n' +
      'Nó giỏi tìm quy luật từ dữ liệu khổng lồ: giúp bác sĩ đọc ảnh, giúp nhà máy dự đoán lỗi, giúp bạn biến tìm kiếm thành đối thoại.\n\n' +
      'Nhưng AI không phải phép màu. Dữ liệu có thành kiến, mô hình hay sai, quyền riêng tư cần ranh giới. Cách dùng đúng là coi AI là công cụ, không phải thẩm quyền.\n\n' +
      'Hiểu nó làm được gì, không làm được gì — bạn mới dùng khôn ngoan hơn.',
  },
  {
    title: 'Một ngày trên Sao Hỏa',
    theme: 'Một ngày trên Sao Hỏa trông như thế nào? So sánh độ dài ngày, nhiệt độ, bão cát và trí tưởng tượng về căn cứ con người, làm thành video khoa học theo cảnh.',
    script:
      'Hãy tưởng tượng bạn thức dậy trên Sao Hỏa: mặt trời xa hơn, nhỏ hơn, bầu trời màu kem nhạt, một ngày khoảng 24 giờ 39 phút.\n\n' +
      'Ban ngày có thể "ấm" đến âm độ, ban đêm lạnh hơn nhiều. Bầu khí quyển CO₂ mỏng không giữ được nhiệt, bão cát thỉnh thoảng phủ kín trời.\n\n' +
      'Các nhà khoa học vẫn đang lên kế hoạch căn cứ: cần chắn bức xạ, tạo oxy, trồng thực phẩm.\n\n' +
      'Hiểu một ngày trên Sao Hỏa là đang tập dượt cho chuyến đi xa tiếp theo của nhân loại.',
  },
  {
    title: 'Sức mạnh của giấc mơ',
    theme: 'Sức mạnh của giấc mơ: chu kỳ ngủ, REM và sắp xếp ký ức, dùng câu chuyện giải thích cách mơ giúp não "ôn lại".',
    script:
      'Khi bạn ngủ, não không nghỉ ngơi.\n\n' +
      'Vào giấc ngủ REM, não như đang phát lại những đoạn ban ngày, ghép thành giấc mơ kỳ ảo. Các nhà khoa học cho rằng điều này giúp sắp xếp ký ức, điều tiết cảm xúc.\n\n' +
      'Ngủ không đủ giấc, khả năng tập trung và sáng tạo đều giảm sút; ngủ đúng giờ giấc như bảo trì đêm cho não bộ.\n\n' +
      'Lần sau mơ kỳ lạ, đừng vội thấy vô nghĩa — đó có thể là não đang tăng ca học bài.',
  },
  {
    title: 'Một chú mèo hoang mùa xuân',
    theme: 'Mùa xuân của một chú mèo hoang: dùng lời dẫn nhân cách hóa kể về hệ sinh thái đô thị, ranh giới cho ăn và cùng sống với vật nuôi, khoa học ấm áp.',
    script:
      'Xuân về, chú mèo vàng đầu hẻm bắt đầu thay lông, tìm kiếm góc an toàn hơn.\n\n' +
      'Động vật hoang trong thành phố tồn tại nhờ bản năng còn sót và lòng tốt vô tình của con người. Cho ăn khoa học, triệt sản và tôn trọng khoảng cách — quan trọng hơn hành động bột phát.\n\n' +
      'Chúng không phải phong cảnh, cũng không phải phiền toái, mà là một phần hệ sinh thái đô thị.\n\n' +
      'Mùa xuân này, chúc mỗi chú mèo đều gặp được ngày mai an ổn hơn.',
  },
  {
    title: 'Bí mật của quang hợp',
    theme: 'Bí mật quang hợp: lá cây biến ánh sáng thành đường như thế nào, giải thích lục lạp, chuyển hóa năng lượng và nguồn oxy của Trái Đất.',
    script:
      'Lá cây không chỉ là trang trí, chúng là nhà máy hóa chất yên tĩnh nhất hành tinh.\n\n' +
      'Lục lạp bắt lấy ánh sáng, biến nước và CO₂ thành đường, đồng thời giải phóng oxy. Không có quá trình này, phần lớn chuỗi thức ăn sẽ đứt gãy.\n\n' +
      'Oxy bạn hít thở, cơm và rau trên bàn ăn — đều gián tiếp đến từ phép màu ánh sáng này.\n\n' +
      'Hiểu quang hợp là hiểu cuốn sổ cái vận hành của sự sống.',
  },
  {
    title: 'Phải làm gì khi động đất',
    theme: 'Phải làm gì khi động đất: dùng tình huống thực tế dạy chuẩn bị trước động đất, tư thế tránh nạn và nhận biết tin đồn, khoa học an toàn thực dụng.',
    script:
      'Mặt đất đột ngột rung lên, phản ứng đầu tiên thường là hoảng loạn.\n\n' +
      'Cách đúng là cúi thấp, che chắn, bám chặt, tránh xa cửa sổ và đồ vật cao; đừng chen nhau vào thang máy. Chuẩn bị túi khẩn cấp từ trước hiệu quả hơn ứng phó tức thời.\n\n' +
      'Sau động đất còn phải đề phòng dư chấn và tin đồn. Thông tin chính thống, trật tự hỗ trợ lẫn nhau — mới là sự an toàn thực sự.\n\n' +
      'Biết chút kiến thức động đất, lúc quan trọng sẽ bình tĩnh hơn một phần.',
  },
]

const PAGE_SIZE = 6

function isDefaultTitle(value: string, untitled: string) {
  const trimmed = value.trim()
  return !trimmed || trimmed === untitled
}

function deriveTitle(text: string, untitled: string) {
  const line = text
    .trim()
    .split(/\n/)[0]
    .replace(/["""'']/g, '')
    .replace(/[。！？!?：:].*$/, '')
    .trim()
  if (!line) return untitled
  return line.slice(0, 18)
}

export default function CreateProjectPage() {
  const { t } = useI18n()

  const nav = useNavigate()
  const [params] = useSearchParams()
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateId, setTemplateId] = useState(params.get('template') || '')
  const [category, setCategory] = useState(t('studio.createProject.all'))
  const [q, setQ] = useState('')
  const [inputTab, setInputTab] = useState(t('studio.createProject.tabTheme'))
  const [sourceText, setSourceText] = useState(INSPIRATION_POOL[0].theme)
  const [title, setTitle] = useState(INSPIRATION_POOL[0].title)
  const [titleTouched, setTitleTouched] = useState(false)
  const [inspPage, setInspPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      nav('/auth')
      return
    }
    api.me().catch(() => nav('/auth'))
    api.templates().then((list) => {
      setTemplates(list)
      const fromUrl = params.get('template') || ''
      setTemplateId((prev) => prev || fromUrl || list[0]?.id || '')
    })
  }, [nav, params])

  const categories = useMemo(() => {
    const found = new Set<string>()
    for (const t of templates) {
      for (const c of t.category || []) {
        if (CATEGORY_ORDER.includes(c)) found.add(c)
      }
    }
    return [t('studio.createProject.all'), t('studio.createProject.featured'), ...CATEGORY_ORDER.filter((c) => found.has(c))]
  }, [templates])

  const filtered = useMemo(() => {
    let list = templates
    if (category === t('studio.createProject.featured')) list = [...templates].sort((a, b) => a.sort_order - b.sort_order).slice(0, 8)
    else if (category !== t('studio.createProject.all')) list = list.filter((t) => (t.category || []).includes(category))
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter((t) => t.name.toLowerCase().includes(s))
    }
    return list
  }, [templates, category, q])

  const selected = templates.find((t) => t.id === templateId)
  const sourceType = inputTab === t('studio.createProject.tabScript') ? 'script' : 'theme'
  const inspTotal = Math.ceil(INSPIRATION_POOL.length / PAGE_SIZE)
  const inspirations = INSPIRATION_POOL.slice(inspPage * PAGE_SIZE, inspPage * PAGE_SIZE + PAGE_SIZE)

  // 把灵感示例填进主题/文案，并同步短标题
  function applyInspiration(item: Inspiration) {
    if (sourceType === 'script') {
      setInputTab(t('studio.createProject.tabScript'))
      setSourceText(item.script.slice(0, 8000))
    } else {
      setInputTab(t('studio.createProject.tabTheme'))
      setSourceText(item.theme.slice(0, 100))
    }
    setTitle(item.title.slice(0, 24))
    setTitleTouched(false)
    setError('')
  }

  function shuffleInspirations() {
    setInspPage((p) => (p + 1) % inspTotal)
  }

  async function aiExpand() {
    const seed = sourceText.trim() || title.trim() || t('studio.createProject.seedDefault')
    setAiBusy(true)
    setError('')
    try {
      const mode = sourceType === 'script' ? 'script' : 'theme'
      const result = await api.expandContent(seed, mode)
      setSourceText(result.content.slice(0, mode === 'theme' ? 100 : 8000))
      if (!titleTouched || isDefaultTitle(title, t('studio.createProject.untitled'))) {
        setTitle(result.title.slice(0, 24))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.createProject.aiGenFailed'))
    } finally {
      setAiBusy(false)
    }
  }

  async function next() {
    if (!templateId || !sourceText.trim()) {
      setError(t('studio.createProject.selectTemplateFirst'))
      return
    }
    setBusy(true)
    setError('')
    try {
      const tpl = templates.find((t) => t.id === templateId)
      const d = tpl ? defaultsFromTemplate(tpl) : undefined
      const modeParam = params.get('mode')
      const pipeline_mode: 'full' | 'image_text' =
        modeParam === 'image_text' || modeParam === 'full' ? modeParam : 'full'
      const finalTitle =
        title.trim() || deriveTitle(sourceText, t('studio.createProject.untitled')) || sourceText.trim().slice(0, 24) || t('studio.createProject.untitled')
      const project = await api.createProject({
        template_id: templateId,
        title: finalTitle,
        source_type: sourceType,
        source_text: sourceText.trim(),
        resolution_mode: 'preview',
        pipeline_mode,
        output_ratio: d?.output_ratio || '16:9',
        voice_id: d?.voice_id,
      })
      nav(`/studio/${project.id}/style`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.createProject.createFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell active="studio" wide>
      <header className="pf-page-head">
        <div className="pf-page-head-row">
          <div>
            <button type="button" className="pf-back" onClick={() => nav('/')}>
              <IconChevronLeft size={18} />
              {t('studio.createProject.backBtn')}
            </button>
            <h1 className="pf-page-title">{t('studio.createProject.pageTitle')}</h1>
          </div>
          <Stepper steps={kepuSteps()} current={kepuStepIndex('create')} doneThrough={-1} />
        </div>
      </header>

      <div className="pf-create">
        <aside className="pf-create-col">
          <h3>{t('studio.createProject.selectTemplate')}</h3>
          <div className="pf-search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('studio.createProject.searchPlaceholder')} />
          </div>
          <PillTabs items={categories.slice(0, 6)} value={category} onChange={setCategory} ariaLabel="模板分类" />
          <div className="pf-tpl-list" style={{ marginTop: '0.75rem' }}>
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                className={templateId === t.id ? 'pf-tpl-mini selected' : 'pf-tpl-mini'}
                onClick={() => setTemplateId(t.id)}
              >
                <img src={api.assetUrl(t.preview_cover)} alt="" />
                <div>
                  <strong>{t.name}</strong>
                  <span>
                    {t.default_ratio} · {(t.category || [])[0] || t('studio.createProject.general')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="pf-create-col">
          <h3>{t('studio.createProject.inputContent')}</h3>
          <div className="pf-input-tabs">
            {[t('studio.createProject.tabTheme'), t('studio.createProject.tabScript')].map((tab) => (
              <button
                key={tab}
                type="button"
                className={['pf-pill', inputTab === tab ? 'lime active' : ''].join(' ')}
                onClick={() => setInputTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <label className="pf-field">
            <span className="pf-field-label">{t('studio.createProject.projectName')}</span>
            <input
              className="pf-field-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setTitleTouched(true)
              }}
              onBlur={() => {
                if (isDefaultTitle(title, t('studio.createProject.untitled')) && sourceText.trim()) {
                  setTitle(deriveTitle(sourceText, t('studio.createProject.untitled')))
                  setTitleTouched(false)
                }
              }}
              placeholder={t('studio.createProject.titlePlaceholder')}
            />
          </label>

          <div className="pf-textarea-wrap">
            <div className="pf-textarea-toolbar">
              <button
                type="button"
                className="pf-btn pf-btn-ai pf-btn-sm pf-btn-icon"
                disabled={aiBusy || busy}
                onClick={aiExpand}
              >
                <IconSparkles size={14} />
                {aiBusy ? t('studio.createProject.aiGenerating2') : sourceType === 'script' ? t('studio.createProject.aiExpandScript') : t('studio.createProject.aiGenTheme')}
              </button>
              <span className="pf-muted" style={{ fontSize: '0.75rem' }}>
                {sourceType === 'script' ? t('studio.createProject.aiExpandHint') : t('studio.createProject.aiGenHint')}
              </span>
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => {
                const next = e.target.value.slice(0, sourceType === 'theme' ? 100 : 8000)
                setSourceText(next)
                if (!titleTouched || isDefaultTitle(title, t('studio.createProject.untitled'))) {
                  setTitle(deriveTitle(next, t('studio.createProject.untitled')))
                }
              }}
              placeholder={
                sourceType === 'theme'
                  ? t('studio.createProject.exampleTheme')
                  : t('studio.createProject.exampleScript')
              }
            />
            {sourceType === 'theme' ? (
              <span className="pf-char-count">{sourceText.length}/100</span>
            ) : (
              <span className="pf-char-count">{sourceText.length} {t('studio.createProject.chars')}</span>
            )}
          </div>

          <div className="pf-inspire">
            <div className="pf-inspire-head">
              <strong>{t('studio.createProject.inspirations')}</strong>
              <button type="button" className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon" onClick={shuffleInspirations}>
                <IconRefresh size={14} />
                {t('studio.createProject.changeBatch')}
              </button>
            </div>
            <div className="pf-chips">
              {inspirations.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className="pf-chip"
                  title={sourceType === 'script' ? item.script.slice(0, 80) : item.theme}
                  onClick={() => applyInspiration(item)}
                >
                  {item.title}
                </button>
              ))}
            </div>
            <p className="pf-muted" style={{ fontSize: '0.78rem', margin: '0.55rem 0 0' }}>
              {t('studio.createProject.exampleTip').replace('{type}', sourceType === 'script' ? t('studio.createProject.script') : t('studio.createProject.theme'))}
            </p>
          </div>

          <div className="pf-hint" style={{ marginTop: '1rem' }}>
            {t('studio.createProject.themeTip')}
          </div>
          {error ? <BillingErrorNotice message={error} /> : null}
        </section>

        <aside className="pf-create-col">
          <h3>{t('studio.createProject.summary')}</h3>
          {selected ? (
            <div style={{ marginBottom: '0.85rem' }}>
              <img
                src={api.assetUrl(selected.preview_cover)}
                alt=""
                style={{ width: '100%', borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover' }}
              />
              <strong style={{ display: 'block', marginTop: '0.5rem' }}>{selected.name}</strong>
              <p className="pf-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                {selected.description}
              </p>
            </div>
          ) : (
            <p className="pf-muted">{t('studio.createProject.pleaseSelectTemplate')}</p>
          )}
          <div className="pf-summary-row">
            <span>{t('studio.createProject.workTitle')}</span>
            <span>{title.trim() || t('studio.createProject.untitled')}</span>
          </div>
          <div className="pf-summary-row">
            <span>{t('studio.createProject.outputMode')}</span>
            <span>{selected?.default_ratio === '9:16' ? t('studio.createProject.video916') : t('studio.createProject.video169')}</span>
          </div>
          <div className="pf-summary-row">
            <span>{t('studio.createProject.estDuration')}</span>
            <span>{t('studio.createProject.estDurationVal')}</span>
          </div>
          <div className="pf-summary-row">
            <span>{t('studio.createProject.language')}</span>
            <span>{t('studio.createProject.languageVal')}</span>
          </div>
          <div className="pf-summary-row">
            <span>{t('studio.createProject.inputMode')}</span>
            <span>{inputTab}</span>
          </div>
          <button
            type="button"
            className="pf-btn pf-btn-lime pf-btn-block pf-btn-lg pf-btn-icon"
            style={{ marginTop: '1.25rem' }}
            disabled={busy || aiBusy || !templateId || !sourceText.trim()}
            onClick={next}
          >
            {busy ? t('studio.createProject.creating') : t('studio.createProject.nextStep')}
            {!busy ? <span aria-hidden>→</span> : null}
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-ghost pf-btn-block pf-btn-sm pf-btn-icon"
            style={{ marginTop: '0.55rem' }}
            disabled={aiBusy || busy}
            onClick={aiExpand}
          >
            <IconSparkles size={14} />
            {aiBusy ? t('studio.createProject.aiGenerating') : t('studio.createProject.aiHelp')}
          </button>
          <p className="pf-muted" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>
            {t('studio.createProject.styleTip')}
          </p>
        </aside>
      </div>
    </AppShell>
  )
}
