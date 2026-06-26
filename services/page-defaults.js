export const WEEKDAY_META = [
  { weekday: 0, label: 'Sunday', letter: 'S' },
  { weekday: 1, label: 'Monday', letter: 'M' },
  { weekday: 2, label: 'Tuesday', letter: 'T' },
  { weekday: 3, label: 'Wednesday', letter: 'W' },
  { weekday: 4, label: 'Thursday', letter: 'T' },
  { weekday: 5, label: 'Friday', letter: 'F' },
  { weekday: 6, label: 'Saturday', letter: 'S' }
];

export const DEFAULT_SECTION_LAYOUT = [
  {
    id: 'blk_profile',
    type: 'profile',
    label: 'Profile',
    description: 'Name, avatar, bio, city',
    enabled: true,
    required: true,
    status: 'empty'
  },
  {
    id: 'blk_services',
    type: 'services',
    label: 'Services',
    description: 'List of bookable sessions',
    enabled: true,
    required: true,
    status: 'empty'
  },
  {
    id: 'blk_availability',
    type: 'availability',
    label: 'Availability',
    description: 'Schedule and booking rules',
    enabled: true,
    required: true,
    status: 'empty'
  },
  {
    id: 'blk_about',
    type: 'about',
    label: 'About page',
    description: 'Turn on to show extra sections below',
    enabled: false,
    required: false,
    status: 'disabled'
  },
  {
    id: 'blk_stories',
    type: 'stories',
    label: 'Stories',
    description: 'Extended bio and narrative',
    enabled: false,
    required: false,
    status: 'disabled'
  },
  {
    id: 'blk_gallery',
    type: 'gallery',
    label: 'Gallery',
    description: 'Photo grid on your about page',
    enabled: false,
    required: false,
    status: 'disabled'
  },
  {
    id: 'blk_video',
    type: 'video',
    label: 'Video',
    description: 'Featured video embed',
    enabled: false,
    required: false,
    status: 'disabled'
  },
  {
    id: 'blk_location',
    type: 'location',
    label: 'Location',
    description: 'Address and map',
    enabled: false,
    required: false,
    status: 'disabled'
  },
  {
    id: 'blk_contacts',
    type: 'contacts',
    label: 'Contacts',
    description: 'Socials and messengers',
    enabled: false,
    required: false,
    status: 'disabled'
  },
  {
    id: 'blk_reviews',
    type: 'reviews',
    label: 'Reviews',
    description: 'Client testimonials',
    enabled: false,
    required: false,
    status: 'disabled'
  },
  {
    id: 'blk_faq',
    type: 'faq',
    label: 'FAQ',
    description: 'Common questions',
    enabled: false,
    required: false,
    status: 'disabled'
  },
  {
    id: 'blk_cancellation',
    type: 'cancellationPolicy',
    label: 'Cancellation policy',
    description: 'Refund rules and notice period',
    enabled: false,
    required: false,
    status: 'disabled'
  },
  {
    id: 'blk_questions',
    type: 'customQuestions',
    label: 'Booking questions',
    description: 'Extra fields on the booking form',
    enabled: false,
    required: false,
    status: 'disabled'
  }
];

export const THEME_MODES = ['light', 'dark', 'auto'];
export const THEME_FONT_PRESETS = ['neutral', 'sport', 'editorial'];
export const THEME_ELEMENT_STYLES = ['rounded', 'sharp', 'pill'];
export const THEME_BACKGROUND_TYPES = ['preset', 'solid', 'gradient', 'image'];

export const DEFAULT_THEME_BACKGROUND = { type: 'preset' };

export const DEFAULT_THEME = {
  accent_color: '#c6f432',
  mode: 'auto',
  font_preset: 'sport',
  element_style: 'rounded',
  background: { ...DEFAULT_THEME_BACKGROUND }
};

export const DEFAULT_AVAILABILITY_SCALARS = {
  timezone: 'UTC',
  buffer_after_minutes: 15,
  min_notice_hours: 4,
  max_days_ahead: 60,
  slot_interval_minutes: 15,
  max_bookings_per_day: 0
};

export const DEFAULT_BLOCK_CONTENT = {
  stories: { body: '' },
  gallery: { items: [] },
  video: { video_url: '', title: '' },
  location: { address: '', show_map: true, directions: '' },
  contacts: {
    instagram: '',
    telegram: '',
    whatsapp: '',
    public_phone: '',
    website: ''
  },
  reviews: { items: [] },
  faq: { items: [] },
  cancellationPolicy: { policy_text: '', cutoff_hours: 24 },
  customQuestions: { items: [] }
};

export const BLOCK_TYPES = [
  'stories',
  'gallery',
  'video',
  'location',
  'contacts',
  'reviews',
  'faq',
  'cancellationPolicy',
  'customQuestions'
];

const ABOUT_NESTED_TYPES = new Set([
  'stories',
  'gallery',
  'video',
  'location',
  'contacts',
  'reviews',
  'faq',
  'cancellationPolicy',
  'customQuestions'
]);

export function isAboutNestedBlockType(type) {
  return ABOUT_NESTED_TYPES.has(type);
}

export function isAboutBlockEnabled(blocks) {
  return blocks.some((b) => b.type === 'about' && b.enabled);
}

export function emptyAvailabilityDays() {
  return WEEKDAY_META.map(({ weekday, label, letter }) => ({
    weekday,
    label,
    letter,
    working: false,
    ranges: []
  }));
}

/** Mon–Fri 09:00–17:00 for DB `page_availability.days` (no label/letter). */
export function defaultAvailabilityDaysStored() {
  return [1, 2, 3, 4, 5].map((weekday) => ({
    weekday,
    working: true,
    ranges: [{ id: `rng-${weekday}`, start: '09:00', end: '17:00' }]
  }));
}

export const DEFAULT_STARTER_SERVICE = {
  title: 'Session',
  subtitle: '',
  duration_minutes: 60,
  price_amount: 0,
  currency: 'PLN',
  price_hidden: false,
  category_id: null,
  is_active: true,
  photo_url: ''
};

export const PAGE_PROFILE_LANGS = ['en', 'ru'];

export const DEFAULT_PROFILE_HEADLINE = {
  headline_line1: 'BOOK YOUR',
  headline_line2: 'NEXT SESSION'
};

export function profileFromUser(user) {
  return {
    name: user.name?.trim() || '',
    role: '',
    bio: user.bio?.trim() || '',
    city: user.city?.trim() || '',
    lang: PAGE_PROFILE_LANGS.includes(user.lang) ? user.lang : 'en',
    avatar_url: user.avatar?.trim() || '',
    email: user.email?.trim() || '',
    phone: user.phone?.trim() || '',
    ...DEFAULT_PROFILE_HEADLINE
  };
}

export function defaultServicesSettings() {
  return {
    use_categories: false,
    categories: [],
    services: []
  };
}
