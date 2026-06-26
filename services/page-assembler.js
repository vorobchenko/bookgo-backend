import {
  BLOCK_TYPES,
  DEFAULT_AVAILABILITY_SCALARS,
  DEFAULT_BLOCK_CONTENT,
  DEFAULT_PROFILE_HEADLINE,
  DEFAULT_SECTION_LAYOUT,
  DEFAULT_THEME,
  isAboutBlockEnabled,
  isAboutNestedBlockType,
  PAGE_PROFILE_LANGS,
  WEEKDAY_META
} from './page-defaults.js';
import { isValidEmailOrEmpty, normalizeEmail } from '../utils/email.js';
import { isAllowedPageAvatarUrl } from '../utils/avatar.js';
import { blockTypeFromApi, blockTypeToApi } from '../utils/block-types.js';
import { jsonField } from '../utils/json-field.js';
import { normalizeThemeBackground } from '../utils/theme-background.js';

function weekdayMeta(weekday) {
  return WEEKDAY_META.find((d) => d.weekday === weekday) ?? {
    weekday,
    label: 'Day',
    letter: '?'
  };
}

export function stripDayLabels(days) {
  if (!Array.isArray(days)) return [];
  return days.map((day) => ({
    weekday: day.weekday,
    working: Boolean(day.working),
    ranges: Array.isArray(day.ranges)
      ? day.ranges.map((range) => ({
          id: range.id,
          start: range.start,
          end: range.end
        }))
      : []
  }));
}

export function enrichAvailabilityDays(storedDays) {
  const byWeekday = new Map(
    (Array.isArray(storedDays) ? storedDays : []).map((day) => [day.weekday, day])
  );

  return WEEKDAY_META.map(({ weekday, label, letter }) => {
    const stored = byWeekday.get(weekday);
    return {
      weekday,
      label,
      letter,
      working: Boolean(stored?.working),
      ranges: Array.isArray(stored?.ranges) ? stored.ranges : []
    };
  });
}

function mapProfileRow(row) {
  if (!row) {
    return {
      name: '',
      role: '',
      bio: '',
      city: '',
      lang: 'en',
      avatar_url: '',
      email: '',
      phone: '',
      ...DEFAULT_PROFILE_HEADLINE
    };
  }

  return {
    name: row.name ?? '',
    role: row.role ?? '',
    bio: row.bio ?? '',
    city: row.city ?? '',
    lang: PAGE_PROFILE_LANGS.includes(row.lang) ? row.lang : 'en',
    avatar_url: row.avatar_url ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    headline_line1: row.headline_line1 ?? DEFAULT_PROFILE_HEADLINE.headline_line1,
    headline_line2: row.headline_line2 ?? DEFAULT_PROFILE_HEADLINE.headline_line2
  };
}

export function mapThemeRow(row) {
  if (!row) {
    return {
      ...DEFAULT_THEME,
      background: { ...DEFAULT_THEME.background }
    };
  }

  return {
    preset: row.preset ?? DEFAULT_THEME.preset,
    accent_color: row.accent_color ?? DEFAULT_THEME.accent_color,
    mode: row.mode ?? DEFAULT_THEME.mode,
    font_preset: row.font_preset ?? DEFAULT_THEME.font_preset,
    element_style: row.element_style ?? DEFAULT_THEME.element_style,
    background: normalizeThemeBackground(row.background)
  };
}

export function mapAvailabilityRow(row) {
  if (!row) {
    return {
      timezone: 'UTC',
      buffer_after_minutes: 15,
      min_notice_hours: 4,
      max_days_ahead: 60,
      slot_interval_minutes: DEFAULT_AVAILABILITY_SCALARS.slot_interval_minutes,
      max_bookings_per_day: DEFAULT_AVAILABILITY_SCALARS.max_bookings_per_day,
      days: enrichAvailabilityDays([])
    };
  }

  return {
    timezone: row.timezone ?? 'UTC',
    buffer_after_minutes: row.buffer_after_minutes ?? 0,
    min_notice_hours: row.min_notice_hours ?? 0,
    max_days_ahead: row.max_days_ahead ?? 60,
    slot_interval_minutes:
      row.slot_interval_minutes ?? DEFAULT_AVAILABILITY_SCALARS.slot_interval_minutes,
    max_bookings_per_day:
      row.max_bookings_per_day ?? DEFAULT_AVAILABILITY_SCALARS.max_bookings_per_day,
    days: enrichAvailabilityDays(row.days)
  };
}

export function mapServiceItemRow(item) {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle ?? '',
    duration_minutes: item.duration_minutes,
    price_amount: item.price_amount,
    currency: item.currency?.trim() || 'PLN',
    price_hidden: Boolean(item.price_hidden),
    category_id: item.category_id,
    is_active: Boolean(item.is_active),
    photo_url: item.photo_url ?? '',
    sort_order: item.sort_order ?? 0
  };
}

function mapServices(pageRow, categoryRows, itemRows) {
  return {
    use_categories: Boolean(pageRow?.services_use_categories),
    categories: categoryRows.map((cat) => ({
      id: cat.id,
      title: cat.title
    })),
    services: itemRows.map((item) => mapServiceItemRow(item))
  };
}

export function assembleServicesSettings(pageRow, categoryRows, itemRows) {
  return mapServices(pageRow, categoryRows, itemRows);
}

function blockDataToSettings(type, data) {
  const payload = data && typeof data === 'object' ? data : {};

  switch (type) {
    case 'stories':
      return { stories: { body: payload.body ?? '' } };
    case 'gallery':
      return { gallery: { items: Array.isArray(payload.items) ? payload.items : [] } };
    case 'video':
      return {
        video: {
          video_url: jsonField(payload, 'video_url', 'videoUrl') ?? '',
          title: payload.title ?? ''
        }
      };
    case 'location':
      return {
        location: {
          address: payload.address ?? '',
          show_map: jsonField(payload, 'show_map', 'showMap') !== false,
          directions: payload.directions ?? ''
        }
      };
    case 'contacts':
      return {
        contacts: {
          instagram: payload.instagram ?? '',
          telegram: payload.telegram ?? '',
          whatsapp: payload.whatsapp ?? '',
          public_phone: jsonField(payload, 'public_phone', 'publicPhone') ?? '',
          website: payload.website ?? ''
        }
      };
    case 'reviews':
      return { reviews: Array.isArray(payload.items) ? payload.items : [] };
    case 'faq':
      return { faq: Array.isArray(payload.items) ? payload.items : [] };
    case 'cancellationPolicy':
      return {
        cancellation: {
          policy_text: jsonField(payload, 'policy_text', 'policyText') ?? '',
          cutoff_hours: jsonField(payload, 'cutoff_hours', 'cutoffHours') ?? 24
        }
      };
    case 'customQuestions':
      return {
        custom_questions: Array.isArray(payload.items) ? payload.items : []
      };
    default:
      return {};
  }
}

function settingsToBlockData(type, settings) {
  switch (type) {
    case 'stories':
      return { body: settings.stories?.body ?? '' };
    case 'gallery':
      return { items: settings.gallery?.items ?? [] };
    case 'video':
      return {
        video_url: settings.video?.video_url ?? '',
        title: settings.video?.title ?? ''
      };
    case 'location':
      return {
        address: settings.location?.address ?? '',
        show_map: settings.location?.show_map !== false,
        directions: settings.location?.directions ?? ''
      };
    case 'contacts':
      return { ...(settings.contacts ?? DEFAULT_BLOCK_CONTENT.contacts) };
    case 'reviews':
      return { items: settings.reviews ?? [] };
    case 'faq':
      return { items: settings.faq ?? [] };
    case 'cancellationPolicy':
      return {
        policy_text: settings.cancellation?.policy_text ?? '',
        cutoff_hours: settings.cancellation?.cutoff_hours ?? 24
      };
    case 'customQuestions':
      return { items: settings.custom_questions ?? [] };
    default:
      return {};
  }
}

function mergeSectionLayout(saved) {
  const savedByType = new Map(
    (Array.isArray(saved) ? saved : []).map((block) => [block.type, block])
  );

  return DEFAULT_SECTION_LAYOUT.map((def) => {
    const existing = savedByType.get(def.type);
    const block = existing
      ? {
          ...def,
          id: existing.id ?? def.id,
          enabled: existing.enabled ?? def.enabled,
          required: existing.required ?? def.required,
          status: existing.status ?? def.status
        }
      : { ...def };
    return {
      ...block,
      type: blockTypeToApi(block.type)
    };
  });
}

function isContactsFilled(contacts) {
  return Boolean(
    contacts.instagram?.trim() ||
      contacts.telegram?.trim() ||
      contacts.whatsapp?.trim() ||
      contacts.public_phone?.trim() ||
      contacts.website?.trim()
  );
}

function syncBlockStatuses(settings) {
  const statusFor = (type) => {
    const internalType = blockTypeFromApi(type);
    switch (internalType) {
      case 'profile':
        return settings.profile.name?.trim() ? 'filled' : 'empty';
      case 'services':
        return settings.services.services.some((s) => s.is_active) ? 'filled' : 'empty';
      case 'availability': {
        const hasBookable = settings.availability.days.some(
          (d) => d.working && d.ranges.length > 0
        );
        return hasBookable ? 'filled' : 'empty';
      }
      case 'about':
        return 'filled';
      case 'stories':
        return settings.stories.body?.trim() ? 'filled' : 'empty';
      case 'gallery':
        return settings.gallery.items.some((m) => m.url?.trim()) ? 'filled' : 'empty';
      case 'video':
        return settings.video.video_url?.trim() ? 'filled' : 'empty';
      case 'location':
        return settings.location.address?.trim() ? 'filled' : 'empty';
      case 'contacts':
        return isContactsFilled(settings.contacts) ? 'filled' : 'empty';
      case 'reviews':
        return settings.reviews.some((r) => r.text?.trim() && r.author?.trim())
          ? 'filled'
          : 'empty';
      case 'faq':
        return settings.faq.some((f) => f.question?.trim() && f.answer?.trim())
          ? 'filled'
          : 'empty';
      case 'cancellationPolicy':
        return settings.cancellation.policy_text?.trim() ? 'filled' : 'empty';
      case 'customQuestions':
        return settings.custom_questions.some((q) => q.label?.trim()) ? 'filled' : 'empty';
      default:
        return 'empty';
    }
  };

  return settings.blocks.map((block) => {
    const internalType = blockTypeFromApi(block.type);
    const aboutOn = isAboutBlockEnabled(settings.blocks);
    if (isAboutNestedBlockType(internalType) && !aboutOn) {
      return { ...block, status: 'disabled' };
    }
    if (!block.enabled) return { ...block, status: 'disabled' };
    return { ...block, status: statusFor(block.type) };
  });
}

export function assemblePageSettings({
  page,
  profile,
  theme,
  availability,
  categories,
  serviceItems,
  blocks
}) {
  const blockRows = blocks ?? [];
  const blockMap = Object.fromEntries(blockRows.map((row) => [row.type, row.data]));

  const contentFromBlocks = {};
  for (const type of BLOCK_TYPES) {
    Object.assign(contentFromBlocks, blockDataToSettings(type, blockMap[type]));
  }

  const baseSettings = {
    profile: mapProfileRow(profile),
    theme: mapThemeRow(theme),
    availability: mapAvailabilityRow(availability),
    services: mapServices(page, categories ?? [], serviceItems ?? []),
    blocks: mergeSectionLayout(page.section_layout),
    stories: contentFromBlocks.stories ?? { body: '' },
    gallery: contentFromBlocks.gallery ?? { items: [] },
    video: contentFromBlocks.video ?? { video_url: '', title: '' },
    location: contentFromBlocks.location ?? {
      address: '',
      show_map: true,
      directions: ''
    },
    contacts: contentFromBlocks.contacts ?? { ...DEFAULT_BLOCK_CONTENT.contacts },
    reviews: contentFromBlocks.reviews ?? [],
    faq: contentFromBlocks.faq ?? [],
    cancellation: contentFromBlocks.cancellation ?? {
      policy_text: '',
      cutoff_hours: 24
    },
    custom_questions: contentFromBlocks.custom_questions ?? [],
    published: Boolean(page.published),
    slug: page.slug
  };

  baseSettings.blocks = syncBlockStatuses(baseSettings);
  return baseSettings;
}

export function assemblePageResponse(page, settings) {
  return {
    id: page.id,
    user_id: page.user_id,
    slug: page.slug,
    published: page.published,
    published_at: page.published_at,
    is_default: page.is_default,
    settings_version: page.settings_version,
    created_at: page.created_at,
    updated_at: page.updated_at,
    settings
  };
}

export function validatePublish(settings) {
  const errors = [];
  let core_complete = 0;
  const core_total = 3;

  if (settings.profile.name?.trim()) {
    core_complete += 1;
  } else {
    errors.push('Add your full name in Profile');
  }

  if (PAGE_PROFILE_LANGS.includes(settings.profile.lang)) {
    core_complete += 1;
  } else {
    errors.push('Set a language in Profile');
  }

  const profileEmail = normalizeEmail(settings.profile.email);
  if (profileEmail && !isValidEmailOrEmpty(profileEmail)) {
    errors.push('Enter a valid email in Profile');
  }

  const profileAvatarUrl = settings.profile.avatar_url?.trim() || '';
  if (profileAvatarUrl && !isAllowedPageAvatarUrl(profileAvatarUrl)) {
    errors.push('Upload a valid photo in Profile');
  }

  const activeServices = settings.services.services.filter((s) => s.is_active);
  if (activeServices.length > 0) {
    core_complete += 1;
  } else {
    errors.push('Enable at least one service');
  }

  const hasBookable = settings.availability.days.some(
    (d) => d.working && d.ranges.length > 0
  );
  if (!hasBookable) {
    errors.push('Set working hours in Schedule');
  }

  const aboutOn = isAboutBlockEnabled(settings.blocks);
  const enabledOptional = settings.blocks.filter((b) => {
    const internalType = blockTypeFromApi(b.type);
    return b.enabled && !b.required && aboutOn && isAboutNestedBlockType(internalType);
  });

  const synced = syncBlockStatuses(settings);
  for (const block of enabledOptional) {
    const match = synced.find((b) => b.id === block.id);
    if (match?.status === 'empty') {
      errors.push(`Fill content for ${block.label} or turn the block off`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    core_complete,
    core_total
  };
}

function normalizeBlocksForStorage(blocks) {
  if (!Array.isArray(blocks)) {
    return blocks;
  }

  return blocks.map((block) => ({
    ...block,
    type: blockTypeFromApi(block.type)
  }));
}

export function disassemblePagePatch(settingsPatch) {
  const result = {
    pageFields: {},
    profileFields: null,
    themeFields: null,
    availabilityFields: null,
    services: null,
    sectionLayout: null,
    blockUpdates: []
  };

  if (settingsPatch.slug !== undefined) {
    result.pageFields.slug = settingsPatch.slug;
  }

  if (settingsPatch.published !== undefined) {
    result.pageFields.published = settingsPatch.published;
  }

  if (settingsPatch.blocks !== undefined) {
    result.sectionLayout = normalizeBlocksForStorage(settingsPatch.blocks);
  }

  if (settingsPatch.profile !== undefined) {
    const p = settingsPatch.profile;
    result.profileFields = {
      name: p.name ?? '',
      role: p.role ?? '',
      bio: p.bio ?? '',
      city: p.city ?? '',
      lang: PAGE_PROFILE_LANGS.includes(p.lang) ? p.lang : 'en',
      avatar_url: p.avatar_url ?? '',
      email: p.email?.trim() ? normalizeEmail(p.email) : '',
      phone: p.phone ?? '',
      headline_line1: p.headline_line1 ?? DEFAULT_PROFILE_HEADLINE.headline_line1,
      headline_line2: p.headline_line2 ?? DEFAULT_PROFILE_HEADLINE.headline_line2
    };
  }

  if (settingsPatch.theme !== undefined) {
    const t = settingsPatch.theme;
    result.themeFields = {
      preset: t.preset ?? DEFAULT_THEME.preset,
      accent_color: t.accent_color ?? DEFAULT_THEME.accent_color,
      mode: t.mode ?? DEFAULT_THEME.mode,
      font_preset: t.font_preset ?? DEFAULT_THEME.font_preset,
      element_style: t.element_style ?? DEFAULT_THEME.element_style,
      background: normalizeThemeBackground(t.background)
    };
  }

  if (settingsPatch.availability !== undefined) {
    const a = settingsPatch.availability;
    result.availabilityFields = {
      timezone: a.timezone ?? 'UTC',
      buffer_after_minutes: a.buffer_after_minutes ?? 0,
      min_notice_hours: a.min_notice_hours ?? 0,
      max_days_ahead: a.max_days_ahead ?? 60,
      slot_interval_minutes:
        a.slot_interval_minutes ?? DEFAULT_AVAILABILITY_SCALARS.slot_interval_minutes,
      max_bookings_per_day:
        a.max_bookings_per_day ?? DEFAULT_AVAILABILITY_SCALARS.max_bookings_per_day,
      days: stripDayLabels(a.days)
    };
  }

  if (settingsPatch.services !== undefined) {
    result.services = settingsPatch.services;
    result.pageFields.services_use_categories = Boolean(settingsPatch.services.use_categories);
  }

  for (const type of BLOCK_TYPES) {
    const data = settingsToBlockData(type, settingsPatch);
    const hasContentKey =
      (type === 'stories' && settingsPatch.stories !== undefined) ||
      (type === 'gallery' && settingsPatch.gallery !== undefined) ||
      (type === 'video' && settingsPatch.video !== undefined) ||
      (type === 'location' && settingsPatch.location !== undefined) ||
      (type === 'contacts' && settingsPatch.contacts !== undefined) ||
      (type === 'reviews' && settingsPatch.reviews !== undefined) ||
      (type === 'faq' && settingsPatch.faq !== undefined) ||
      (type === 'cancellationPolicy' && settingsPatch.cancellation !== undefined) ||
      (type === 'customQuestions' && settingsPatch.custom_questions !== undefined);

    if (hasContentKey) {
      result.blockUpdates.push({ type, data });
    }
  }

  return result;
}

export { settingsToBlockData };
