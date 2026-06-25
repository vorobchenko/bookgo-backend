import { getPageOwnedByUser } from '../../services/pages.repository.js';
import {
  createPageServiceCategory,
  createPageServiceItem,
  deletePageServiceCategory,
  deletePageServiceItem,
  getPageServicesSettings,
  setPageServiceActive,
  updatePageServiceCategory,
  updatePageServiceItem,
  updatePageServicesSettings
} from '../../services/page-services.repository.js';
import { isUuid } from '../../utils/slug.js';
import {
  parseCategoryCreateBody,
  parseCategoryPatchBody,
  parseServiceCreateBody,
  parseServicePatchBody,
  parseServicesSettingsPatch
} from '../../utils/page-service-validation.js';

function validationMessage(req, code) {
  const key = `pages.services.validation.${code}`;
  const translated = req.t(key);
  if (translated !== key) {
    return translated;
  }
  return req.t('pages.services.validation.invalid');
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

function requireServiceId(req, res) {
  const { serviceId } = req.params;
  if (!isUuid(serviceId)) {
    res.status(404).json({
      success: false,
      message: req.t('pages.services.notFound')
    });
    return null;
  }
  return serviceId;
}

function requireCategoryId(req, res) {
  const { categoryId } = req.params;
  if (!isUuid(categoryId)) {
    res.status(404).json({
      success: false,
      message: req.t('pages.services.categoryNotFound')
    });
    return null;
  }
  return categoryId;
}

function handleRepositoryError(req, res, error, fallbackKey) {
  if (error?.code === 'CATEGORY_NOT_FOUND') {
    return res.status(400).json({
      success: false,
      message: req.t('pages.services.categoryNotFound')
    });
  }

  console.error(fallbackKey, error);
  return res.status(500).json({
    success: false,
    message: req.t(fallbackKey)
  });
}

export async function listPageServicesHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const services = await getPageServicesSettings(page.id);
    if (!services) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.services.listSuccess'),
      data: { services }
    });
  } catch (error) {
    return handleRepositoryError(req, res, error, 'pages.services.listError');
  }
}

export async function patchPageServicesSettingsHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const parsed = parseServicesSettingsPatch(req.body);
    if (!parsed.ok) {
      return res.status(400).json({
        success: false,
        message: validationMessage(req, parsed.code)
      });
    }

    const result = await updatePageServicesSettings(page.id, parsed.value);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.services.settingsUpdateSuccess'),
      data: result
    });
  } catch (error) {
    return handleRepositoryError(req, res, error, 'pages.services.settingsUpdateError');
  }
}

export async function createPageServiceHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const parsed = parseServiceCreateBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({
        success: false,
        message: validationMessage(req, parsed.code)
      });
    }

    const result = await createPageServiceItem(page.id, parsed.value);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    return res.status(201).json({
      success: true,
      message: req.t('pages.services.createSuccess'),
      data: result
    });
  } catch (error) {
    return handleRepositoryError(req, res, error, 'pages.services.createError');
  }
}

export async function patchPageServiceHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const serviceId = requireServiceId(req, res);
    if (!serviceId) return;

    const parsed = parseServicePatchBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({
        success: false,
        message: validationMessage(req, parsed.code)
      });
    }

    const result = await updatePageServiceItem(page.id, serviceId, parsed.value);
    if (result?.notFound) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.services.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.services.updateSuccess'),
      data: result
    });
  } catch (error) {
    return handleRepositoryError(req, res, error, 'pages.services.updateError');
  }
}

export async function deletePageServiceHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const serviceId = requireServiceId(req, res);
    if (!serviceId) return;

    const result = await deletePageServiceItem(page.id, serviceId);
    if (result?.notFound) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.services.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.services.deleteSuccess'),
      data: result
    });
  } catch (error) {
    return handleRepositoryError(req, res, error, 'pages.services.deleteError');
  }
}

export async function activatePageServiceHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const serviceId = requireServiceId(req, res);
    if (!serviceId) return;

    const result = await setPageServiceActive(page.id, serviceId, true);
    if (result?.notFound) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.services.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.services.activateSuccess'),
      data: result
    });
  } catch (error) {
    return handleRepositoryError(req, res, error, 'pages.services.updateError');
  }
}

export async function deactivatePageServiceHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const serviceId = requireServiceId(req, res);
    if (!serviceId) return;

    const result = await setPageServiceActive(page.id, serviceId, false);
    if (result?.notFound) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.services.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.services.deactivateSuccess'),
      data: result
    });
  } catch (error) {
    return handleRepositoryError(req, res, error, 'pages.services.updateError');
  }
}

export async function createPageServiceCategoryHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const parsed = parseCategoryCreateBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({
        success: false,
        message: validationMessage(req, parsed.code)
      });
    }

    const result = await createPageServiceCategory(page.id, parsed.value);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    return res.status(201).json({
      success: true,
      message: req.t('pages.services.categoryCreateSuccess'),
      data: result
    });
  } catch (error) {
    return handleRepositoryError(req, res, error, 'pages.services.categoryCreateError');
  }
}

export async function patchPageServiceCategoryHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const categoryId = requireCategoryId(req, res);
    if (!categoryId) return;

    const parsed = parseCategoryPatchBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({
        success: false,
        message: validationMessage(req, parsed.code)
      });
    }

    const result = await updatePageServiceCategory(page.id, categoryId, parsed.value);
    if (result?.notFound) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.services.categoryNotFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.services.categoryUpdateSuccess'),
      data: result
    });
  } catch (error) {
    return handleRepositoryError(req, res, error, 'pages.services.categoryUpdateError');
  }
}

export async function deletePageServiceCategoryHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const categoryId = requireCategoryId(req, res);
    if (!categoryId) return;

    const result = await deletePageServiceCategory(page.id, categoryId);
    if (result?.notFound) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.services.categoryNotFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.services.categoryDeleteSuccess'),
      data: result
    });
  } catch (error) {
    return handleRepositoryError(req, res, error, 'pages.services.categoryDeleteError');
  }
}
