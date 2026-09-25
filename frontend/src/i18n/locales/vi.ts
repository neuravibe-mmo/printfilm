import { viPages } from './vi/pages'
import { viShell } from './vi/shell'
import { viStudio } from './vi/studio'
import { viDrama } from './vi/drama'
import { viBilling } from './vi/billing'

export const vi = {
  ...viShell,
  ...viPages,
  ...viStudio,
  ...viDrama,
  ...viBilling,
}
