import { isUuid } from './slug.js';
import { isValidDateOnly } from './zoned-time.js';

export function parseSlotsQuery(query) {
  const serviceId = typeof query.service_id === 'string' ? query.service_id.trim() : '';
  if (!isUuid(serviceId)) {
    return { ok: false, code: 'SERVICE_ID_INVALID' };
  }

  const from = typeof query.from === 'string' ? query.from.trim() : '';
  const to = typeof query.to === 'string' ? query.to.trim() : '';

  if (from && !isValidDateOnly(from)) {
    return { ok: false, code: 'FROM_INVALID' };
  }

  if (to && !isValidDateOnly(to)) {
    return { ok: false, code: 'TO_INVALID' };
  }

  if (from && to && from > to) {
    return { ok: false, code: 'RANGE_INVALID' };
  }

  return {
    ok: true,
    value: {
      serviceId,
      from: from || undefined,
      to: to || undefined
    }
  };
}
