import { getPageOwnedByUser } from '../../services/pages.repository.js';
import { getPageTheme, updatePageTheme } from '../../services/page-theme.repository.js';
import { parseThemePatchBody } from '../../utils/page-theme-validation.js';

function validationMessage(req, code) {
  const key = `pages.theme.validation.${code}`;
  const translated = req.t(key);
  if (translated !== key) {
    return translated;
  }
  return req.t('pages.theme.validation.invalid');
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

export async function getPageThemeHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const result = await getPageTheme(page.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.theme.getSuccess'),
      data: result
    });
  } catch (error) {
    return handleError(req, res, error, 'pages.theme.getError');
  }
}

export async function patchPageThemeHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const current = await getPageTheme(page.id);
    const parsed = parseThemePatchBody(req.body, current?.theme);
    if (!parsed.ok) {
      return res.status(400).json({
        success: false,
        message: validationMessage(req, parsed.code)
      });
    }

    const result = await updatePageTheme(page.id, parsed.value);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.theme.updateSuccess'),
      data: result
    });
  } catch (error) {
    return handleError(req, res, error, 'pages.theme.updateError');
  }
}
