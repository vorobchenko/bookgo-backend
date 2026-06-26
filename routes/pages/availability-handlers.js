import { getPageOwnedByUser } from '../../services/pages.repository.js';
import {
  getPageAvailability,
  updatePageAvailability,
  updatePageBookingDays,
  updatePageBookingRules,
  updatePageWeeklyHours
} from '../../services/page-availability.repository.js';
import {
  parseAvailabilityPatchBody,
  parseBookingDaysPatchBody,
  parseBookingRulesPatchBody,
  parseWeeklyHoursPatchBody
} from '../../utils/page-availability-validation.js';

function validationMessage(req, code) {
  const key = `pages.availability.validation.${code}`;
  const translated = req.t(key);
  if (translated !== key) {
    return translated;
  }
  return req.t('pages.availability.validation.invalid');
}

async function requireOwnedPage(req, res) {
  const page = await getPageOwnedByUser(req.params.id, req.user.id);
  if (!page) {
    res.status(404).json({
      success: false,
      message: req.t('pages.get.notFound')
    });
    return null;
  }
  return page;
}

function handleError(req, res, error, fallbackKey) {
  console.error(fallbackKey, error);
  return res.status(500).json({
    success: false,
    message: req.t(fallbackKey)
  });
}

export async function getPageAvailabilityHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const result = await getPageAvailability(page.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.availability.getSuccess'),
      data: result
    });
  } catch (error) {
    return handleError(req, res, error, 'pages.availability.getError');
  }
}

export async function patchPageAvailabilityHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const parsed = parseAvailabilityPatchBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({
        success: false,
        message: validationMessage(req, parsed.code)
      });
    }

    const result = await updatePageAvailability(page.id, parsed.value);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.availability.updateSuccess'),
      data: result
    });
  } catch (error) {
    return handleError(req, res, error, 'pages.availability.updateError');
  }
}

export async function patchPageWeeklyHoursHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const parsed = parseWeeklyHoursPatchBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({
        success: false,
        message: validationMessage(req, parsed.code)
      });
    }

    const result = await updatePageWeeklyHours(page.id, parsed.value);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.availability.weeklyHoursSuccess'),
      data: result
    });
  } catch (error) {
    return handleError(req, res, error, 'pages.availability.updateError');
  }
}

export async function patchPageBookingDaysHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const parsed = parseBookingDaysPatchBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({
        success: false,
        message: validationMessage(req, parsed.code)
      });
    }

    const result = await updatePageBookingDays(page.id, parsed.value);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.availability.bookingDaysSuccess'),
      data: result
    });
  } catch (error) {
    return handleError(req, res, error, 'pages.availability.updateError');
  }
}

export async function patchPageBookingRulesHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const parsed = parseBookingRulesPatchBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({
        success: false,
        message: validationMessage(req, parsed.code)
      });
    }

    const result = await updatePageBookingRules(page.id, parsed.value);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.availability.bookingRulesSuccess'),
      data: result
    });
  } catch (error) {
    return handleError(req, res, error, 'pages.availability.updateError');
  }
}
