import { getPageOwnedByUser, getPublishedPageBySlug } from '../../services/pages.repository.js';
import { getPageSlots } from '../../services/page-slots.service.js';
import { parseSlotsQuery } from '../../utils/page-slots-validation.js';
import { isValidSlug, slugify } from '../../utils/slug.js';

function validationMessage(req, code) {
  const key = `pages.slots.validation.${code}`;
  const translated = req.t(key);
  if (translated !== key) {
    return translated;
  }
  return req.t('pages.slots.validation.invalid');
}

function handleError(req, res, error, fallbackKey) {
  console.error(fallbackKey, error);
  return res.status(500).json({
    success: false,
    message: req.t(fallbackKey)
  });
}

async function loadSlotsForPage(req, res, page) {
  const parsed = parseSlotsQuery(req.query);
  if (!parsed.ok) {
    res.status(400).json({
      success: false,
      message: validationMessage(req, parsed.code)
    });
    return null;
  }

  const result = await getPageSlots(page.id, parsed.value);
  if (!result.ok) {
    res.status(404).json({
      success: false,
      message: validationMessage(req, result.code)
    });
    return null;
  }

  return result.value;
}

export async function getPageSlotsHandler(req, res) {
  try {
    const page = await getPageOwnedByUser(req.params.id, req.user.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    const slots = await loadSlotsForPage(req, res, page);
    if (!slots) return;

    return res.status(200).json({
      success: true,
      message: req.t('pages.slots.getSuccess'),
      data: slots
    });
  } catch (error) {
    return handleError(req, res, error, 'pages.slots.getError');
  }
}

export async function getPublicPageSlotsHandler(req, res) {
  try {
    const slug = slugify(req.params.slug);
    if (!isValidSlug(slug)) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.public.notFound')
      });
    }

    const page = await getPublishedPageBySlug(slug);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.public.notFound')
      });
    }

    const slots = await loadSlotsForPage(req, res, page);
    if (!slots) return;

    return res.status(200).json({
      success: true,
      message: req.t('pages.slots.getSuccess'),
      data: slots
    });
  } catch (error) {
    return handleError(req, res, error, 'pages.slots.getError');
  }
}
