import {
  BLOCK_TYPES,
  DEFAULT_BLOCK_CONTENT,
  DEFAULT_SECTION_LAYOUT,
  DEFAULT_THEME,
  isAboutBlockEnabled,
  isAboutNestedBlockType,
  WEEKDAY_META
} from './page-defaults.js';
import { isValidEmailOrEmpty, normalizeEmail } from '../utils/email.js';

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
    bookable: Boolean(day.bookable),
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
      bookable: Boolean(stored?.bookable),
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
      timezone: 'UTC',
      avatarUrl: '',
      email: '',
      phone: ''
    };
  }

  return {
    name: row.name ?? '',
    role: row.role ?? '',
    bio: row.bio ?? '',
    city: row.city ?? '',
    timezone: row.timezone ?? 'UTC',
    avatarUrl: row.avatar_url ?? '',
    email: row.email ?? '',
    phone: row.phone ?? ''
  };
}

function mapThemeRow(row) {
  if (!row) return { ...DEFAULT_THEME };
  return {
    preset: row.preset ?? DEFAULT_THEME.preset,
    accentColor: row.accent_color ?? DEFAULT_THEME.accentColor,
    mode: row.mode ?? DEFAULT_THEME.mode
  };
}

function mapAvailabilityRow(row) {
  if (!row) {
    return {
      timezone: 'UTC',
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 15,
      minNoticeHours: 4,
      maxDaysAhead: 60,
      days: enrichAvailabilityDays([])
    };
  }

  return {
    timezone: row.timezone ?? 'UTC',
    bufferBeforeMinutes: row.buffer_before_minutes ?? 0,
    bufferAfterMinutes: row.buffer_after_minutes ?? 0,
    minNoticeHours: row.min_notice_hours ?? 0,
    maxDaysAhead: row.max_days_ahead ?? 60,
    days: enrichAvailabilityDays(row.days)
  };
}

function mapServices(pageRow, categoryRows, itemRows) {
  return {
    useCategories: Boolean(pageRow?.services_use_categories),
    categories: categoryRows.map((cat) => ({
      id: cat.id,
      title: cat.title
    })),
    services: itemRows.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle ?? '',
      durationMinutes: item.duration_minutes,
      priceAmount: item.price_amount,
      currency: item.currency?.trim() || 'PLN',
      priceHidden: Boolean(item.price_hidden),
      categoryId: item.category_id,
      isActive: Boolean(item.is_active),
      photoUrl: item.photo_url ?? ''
    }))
  };
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
          videoUrl: payload.videoUrl ?? '',
          title: payload.title ?? ''
        }
      };
    case 'location':
      return {
        location: {
          address: payload.address ?? '',
          showMap: payload.showMap !== false,
          directions: payload.directions ?? ''
        }
      };
    case 'contacts':
      return {
        contacts: {
          instagram: payload.instagram ?? '',
          telegram: payload.telegram ?? '',
          whatsapp: payload.whatsapp ?? '',
          publicPhone: payload.publicPhone ?? '',
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
          policyText: payload.policyText ?? '',
          cutoffHours: payload.cutoffHours ?? 24
        }
      };
    case 'customQuestions':
      return {
        customQuestions: Array.isArray(payload.items) ? payload.items : []
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
        videoUrl: settings.video?.videoUrl ?? '',
        title: settings.video?.title ?? ''
      };
    case 'location':
      return {
        address: settings.location?.address ?? '',
        showMap: settings.location?.showMap !== false,
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
        policyText: settings.cancellation?.policyText ?? '',
        cutoffHours: settings.cancellation?.cutoffHours ?? 24
      };
    case 'customQuestions':
      return { items: settings.customQuestions ?? [] };
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
    if (!existing) return { ...def };
    return {
      ...def,
      id: existing.id ?? def.id,
      enabled: existing.enabled ?? def.enabled,
      required: existing.required ?? def.required,
      status: existing.status ?? def.status
    };
  });
}

function isContactsFilled(contacts) {
  return Boolean(
    contacts.instagram?.trim() ||
      contacts.telegram?.trim() ||
      contacts.whatsapp?.trim() ||
      contacts.publicPhone?.trim() ||
      contacts.website?.trim()
  );
}

function syncBlockStatuses(settings) {
  const statusFor = (type) => {
    switch (type) {
      case 'profile':
        return settings.profile.name?.trim() ? 'filled' : 'empty';
      case 'services':
        return settings.services.services.some((s) => s.isActive) ? 'filled' : 'empty';
      case 'availability': {
        const hasBookable = settings.availability.days.some(
          (d) => d.bookable && d.ranges.length > 0
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
        return settings.video.videoUrl?.trim() ? 'filled' : 'empty';
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
        return settings.cancellation.policyText?.trim() ? 'filled' : 'empty';
      case 'customQuestions':
        return settings.customQuestions.some((q) => q.label?.trim()) ? 'filled' : 'empty';
      default:
        return 'empty';
    }
  };

  return settings.blocks.map((block) => {
    const aboutOn = isAboutBlockEnabled(settings.blocks);
    if (isAboutNestedBlockType(block.type) && !aboutOn) {
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
    video: contentFromBlocks.video ?? { videoUrl: '', title: '' },
    location: contentFromBlocks.location ?? {
      address: '',
      showMap: true,
      directions: ''
    },
    contacts: contentFromBlocks.contacts ?? { ...DEFAULT_BLOCK_CONTENT.contacts },
    reviews: contentFromBlocks.reviews ?? [],
    faq: contentFromBlocks.faq ?? [],
    cancellation: contentFromBlocks.cancellation ?? {
      policyText: '',
      cutoffHours: 24
    },
    customQuestions: contentFromBlocks.customQuestions ?? [],
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
  let coreComplete = 0;
  const coreTotal = 3;

  if (settings.profile.name?.trim()) {
    coreComplete += 1;
  } else {
    errors.push('Add your full name in Profile');
  }

  if (settings.profile.timezone?.trim()) {
    coreComplete += 1;
  } else {
    errors.push('Set a timezone in Profile');
  }

  const profileEmail = normalizeEmail(settings.profile.email);
  if (profileEmail && !isValidEmailOrEmpty(profileEmail)) {
    errors.push('Enter a valid email in Profile');
  }

  const activeServices = settings.services.services.filter((s) => s.isActive);
  if (activeServices.length > 0) {
    coreComplete += 1;
  } else {
    errors.push('Enable at least one service');
  }

  const hasBookable = settings.availability.days.some(
    (d) => d.bookable && d.ranges.length > 0
  );
  if (!hasBookable) {
    errors.push('Set bookable hours in Schedule');
  }

  const aboutOn = isAboutBlockEnabled(settings.blocks);
  const enabledOptional = settings.blocks.filter(
    (b) => b.enabled && !b.required && aboutOn && isAboutNestedBlockType(b.type)
  );

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
    coreComplete,
    coreTotal
  };
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
    result.sectionLayout = settingsPatch.blocks;
  }

  if (settingsPatch.profile !== undefined) {
    const p = settingsPatch.profile;
    result.profileFields = {
      name: p.name ?? '',
      role: p.role ?? '',
      bio: p.bio ?? '',
      city: p.city ?? '',
      timezone: p.timezone ?? 'UTC',
      avatar_url: p.avatarUrl ?? '',
      email: p.email?.trim() ? normalizeEmail(p.email) : '',
      phone: p.phone ?? ''
    };
  }

  if (settingsPatch.theme !== undefined) {
    const t = settingsPatch.theme;
    result.themeFields = {
      preset: t.preset ?? 'bold',
      accent_color: t.accentColor ?? '#c6f432',
      mode: t.mode ?? 'auto'
    };
  }

  if (settingsPatch.availability !== undefined) {
    const a = settingsPatch.availability;
    result.availabilityFields = {
      timezone: a.timezone ?? 'UTC',
      buffer_before_minutes: a.bufferBeforeMinutes ?? 0,
      buffer_after_minutes: a.bufferAfterMinutes ?? 0,
      min_notice_hours: a.minNoticeHours ?? 0,
      max_days_ahead: a.maxDaysAhead ?? 60,
      days: stripDayLabels(a.days)
    };
  }

  if (settingsPatch.services !== undefined) {
    result.services = settingsPatch.services;
    result.pageFields.services_use_categories = Boolean(settingsPatch.services.useCategories);
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
      (type === 'customQuestions' && settingsPatch.customQuestions !== undefined);

    if (hasContentKey) {
      result.blockUpdates.push({ type, data });
    }
  }

  return result;
}

export { settingsToBlockData };
