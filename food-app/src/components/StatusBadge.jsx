import { STATUS, STATUS_LABEL } from '../lib/status.js'

const TONE = {
  [STATUS.PLACED]: 'info',
  [STATUS.PREPARING]: 'warn',
  [STATUS.READY]: 'warn',
  [STATUS.OUT_FOR_DELIVERY]: 'warn',
  [STATUS.COMPLETED]: 'good',
  [STATUS.CANCELLED]: 'bad',
}

export default function StatusBadge({ status }) {
  const tone = TONE[status] ?? 'info'
  return <span className={`status-badge status-badge--${tone}`}>{STATUS_LABEL[status] ?? status}</span>
}
