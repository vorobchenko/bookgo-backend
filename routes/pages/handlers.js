import {
  assemblePageResponse,
  assemblePageSettings,
  disassemblePagePatch,
  validatePublish
} from '../../services/page-assembler.js';
import {
  applyPagePatch,
  countUserPages,
  createPageForUser,
  deletePage,
  getPageOwnedByUser,
  getPublishedPageBySlug,
  listPagesByUser,
  loadPageRelations,
  publishPage,
  setPageDefault,
  slugExists
} from '../../services/pages.repository.js';
import { query } from '../../utils/db.js';
import { isValidSlug, slugify } from '../../utils/slug.js';
import { isValidEmailOrEmpty, normalizeEmail } from '../../utils/email.js';
import { isAllowedPageAvatarUrl } from '../../utils/avatar.js';

export async function loadAssembledPage(page) {
  const relations = await loadPageRelations(page.id);
  const settings = assemblePageSettings({
    page,
    ...relations
  });
  return assemblePageResponse(page, settings);
}

async function uniqueSlugFromBase(base, excludePageId = null) {
  let candidate = slugify(base);
  if (!isValidSlug(candidate)) {
    candidate = `page-${Date.now().toString(36)}`;
  }

  if (!(await slugExists(candidate, excludePageId))) {
    return candidate;
  }

  for (let i = 2; i < 1000; i += 1) {
    const next = `${candidate}-${i}`.slice(0, 48);
    if (!(await slugExists(next, excludePageId))) {
      return next;
    }
  }

  return `page-${crypto.randomUUID().slice(0, 8)}`;
}

export async function listPages(req, res) {
  try {
    const rows = await listPagesByUser(req.user.id);
    const pages = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      published: row.published,
      published_at: row.published_at,
      is_default: row.is_default,
      settings_version: row.settings_version,
      created_at: row.created_at,
      updated_at: row.updated_at,
      preview: {
        name: row.profile_name ?? '',
        role: row.profile_role ?? '',
        avatar_url: row.profile_avatar_url ?? ''
      }
    }));

    return res.status(200).json({
      success: true,
      message: req.t('pages.list.success'),
      data: { pages }
    });
  } catch (error) {
    console.error('List pages error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('pages.list.error')
    });
  }
}

export async function createPage(req, res) {
  try {
    const body = req.body || {};
    let slug = body.slug ? slugify(body.slug) : null;

    const userResult = await query(
      `SELECT id, email, name, phone, avatar, bio, city, timezone
       FROM users WHERE id = $1 AND is_active = true`,
      [req.user.id]
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.create.userNotFound')
      });
    }

    if (!slug) {
      slug = await uniqueSlugFromBase(user.name || user.email.split('@')[0]);
    }

    if (!isValidSlug(slug)) {
      return res.status(400).json({
        success: false,
        message: req.t('pages.validation.slugInvalid')
      });
    }

    if (await slugExists(slug)) {
      return res.status(409).json({
        success: false,
        message: req.t('pages.validation.slugTaken')
      });
    }

    const pageCount = await countUserPages(req.user.id);
    const isDefault = body.is_default === true || pageCount === 0;

    const page = await createPageForUser(user, { slug, isDefault });
    const assembled = await loadAssembledPage(page);

    return res.status(201).json({
      success: true,
      message: req.t('pages.create.success'),
      data: { page: assembled }
    });
  } catch (error) {
    console.error('Create page error:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: req.t('pages.validation.slugTaken')
      });
    }
    return res.status(500).json({
      success: false,
      message: req.t('pages.create.error')
    });
  }
}

export async function getPage(req, res) {
  try {
    const page = await getPageOwnedByUser(req.params.id, req.user.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    const assembled = await loadAssembledPage(page);
    return res.status(200).json({
      success: true,
      message: req.t('pages.get.success'),
      data: { page: assembled }
    });
  } catch (error) {
    console.error('Get page error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('pages.get.error')
    });
  }
}

export async function patchPage(req, res) {
  try {
    const page = await getPageOwnedByUser(req.params.id, req.user.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    const body = req.body || {};
    const settingsPatch = {
      ...(body.settings && typeof body.settings === 'object' ? body.settings : {}),
      ...(body.slug !== undefined ? { slug: body.slug } : {}),
      ...(body.published !== undefined ? { published: body.published } : {})
    };

    const patch = disassemblePagePatch(settingsPatch);

    if (patch.pageFields.slug !== undefined) {
      const slug = slugify(patch.pageFields.slug);
      if (!isValidSlug(slug)) {
        return res.status(400).json({
          success: false,
          message: req.t('pages.validation.slugInvalid')
        });
      }
      if (await slugExists(slug, page.id)) {
        return res.status(409).json({
          success: false,
          message: req.t('pages.validation.slugTaken')
        });
      }
      patch.pageFields.slug = slug;
    }

    if (patch.profileFields?.email !== undefined) {
      const email = normalizeEmail(patch.profileFields.email);
      if (!isValidEmailOrEmpty(email)) {
        return res.status(400).json({
          success: false,
          message: req.t('pages.validation.emailInvalid')
        });
      }
      patch.profileFields.email = email;
    }

    if (patch.profileFields?.avatar_url !== undefined) {
      const avatarUrl = patch.profileFields.avatar_url?.trim() || '';
      if (avatarUrl && !isAllowedPageAvatarUrl(avatarUrl)) {
        return res.status(400).json({
          success: false,
          message: req.t('pages.avatar.urlInvalid')
        });
      }
      patch.profileFields.avatar_url = avatarUrl;
    }

    const updated = await applyPagePatch(page.id, patch);
    const assembled = await loadAssembledPage(updated);

    return res.status(200).json({
      success: true,
      message: req.t('pages.patch.success'),
      data: { page: assembled }
    });
  } catch (error) {
    console.error('Patch page error:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: req.t('pages.validation.slugTaken')
      });
    }
    return res.status(500).json({
      success: false,
      message: req.t('pages.patch.error')
    });
  }
}

export async function publishPageHandler(req, res) {
  try {
    const page = await getPageOwnedByUser(req.params.id, req.user.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    const assembled = await loadAssembledPage(page);
    const validation = validatePublish(assembled.settings);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: req.t('pages.publish.validationFailed'),
        data: { validation }
      });
    }

    const published = await publishPage(page.id, true);
    const result = await loadAssembledPage(published);

    return res.status(200).json({
      success: true,
      message: req.t('pages.publish.success'),
      data: { page: result, validation }
    });
  } catch (error) {
    console.error('Publish page error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('pages.publish.error')
    });
  }
}

export async function unpublishPageHandler(req, res) {
  try {
    const page = await getPageOwnedByUser(req.params.id, req.user.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    const unpublished = await publishPage(page.id, false);
    const result = await loadAssembledPage(unpublished);

    return res.status(200).json({
      success: true,
      message: req.t('pages.unpublish.success'),
      data: { page: result }
    });
  } catch (error) {
    console.error('Unpublish page error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('pages.unpublish.error')
    });
  }
}

export async function deletePageHandler(req, res) {
  try {
    const deleted = await deletePage(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.delete.success')
    });
  } catch (error) {
    console.error('Delete page error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('pages.delete.error')
    });
  }
}

export async function setDefaultPageHandler(req, res) {
  try {
    const page = await setPageDefault(req.params.id, req.user.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    const assembled = await loadAssembledPage(page);
    return res.status(200).json({
      success: true,
      message: req.t('pages.setDefault.success'),
      data: { page: assembled }
    });
  } catch (error) {
    console.error('Set default page error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('pages.setDefault.error')
    });
  }
}

export async function getPublicPage(req, res) {
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

    const assembled = await loadAssembledPage(page);
    return res.status(200).json({
      success: true,
      message: req.t('pages.public.success'),
      data: { page: assembled }
    });
  } catch (error) {
    console.error('Public page error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('pages.public.error')
    });
  }
}
