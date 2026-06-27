import { uploadPageBrand } from '../../services/avatar-storage.js';
import { generateAiThemeStyles } from '../../services/ai-theme-style.service.js';
import {
  countRecentAiStyleBatches,
  insertAiStyleBatch,
  isValidStyleId,
  listPageAiStyles,
  newBatchId,
  applyPageAiStyle
} from '../../services/page-ai-styles.repository.js';
import { getPageOwnedByUser } from '../../services/pages.repository.js';
import { isS3StorageConfigured } from '../../utils/s3-storage.js';

const HINT_MAX_LENGTH = 200;
const RATE_LIMIT_BATCHES_PER_HOUR = Number(process.env.AI_STYLE_RATE_LIMIT_PER_HOUR ?? 10);

function validationMessage(req, code) {
  const key = `pages.theme.aiStyle.validation.${code}`;
  const translated = req.t(key);
  if (translated !== key) {
    return translated;
  }
  return req.t('pages.theme.aiStyle.validation.invalid');
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

function mapAiStyleError(req, res, error) {
  const code = error.code;

  if (code === 'INVALID_FILE_TYPE' || code === 'BRAND_FILE_INVALID') {
    return res.status(400).json({
      success: false,
      message: req.t('pages.theme.aiStyle.brandFileInvalid')
    });
  }

  if (code === 'HINT_TOO_LONG') {
    return res.status(400).json({
      success: false,
      message: validationMessage(req, 'HINT_TOO_LONG')
    });
  }

  if (code === 'STYLE_ID_INVALID') {
    return res.status(400).json({
      success: false,
      message: validationMessage(req, 'STYLE_ID_INVALID')
    });
  }

  if (code === 'AI_STYLE_FAILED') {
    return res.status(422).json({
      success: false,
      message: req.t('pages.theme.aiStyle.generateFailed')
    });
  }

  if (code === 'AI_STYLE_RATE_LIMIT') {
    return res.status(429).json({
      success: false,
      message: req.t('pages.theme.aiStyle.rateLimit')
    });
  }

  if (code === 'AI_PROVIDER_UNAVAILABLE') {
    return res.status(503).json({
      success: false,
      message: req.t('pages.theme.aiStyle.providerUnavailable')
    });
  }

  return null;
}

export async function generatePageAiStyleHandler(req, res) {
  try {
    if (!isS3StorageConfigured()) {
      return res.status(503).json({
        success: false,
        message: req.t('pages.theme.aiStyle.storageNotConfigured')
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: req.t('pages.theme.aiStyle.brandFileRequired')
      });
    }

    const hint = typeof req.body?.hint === 'string' ? req.body.hint.trim() : '';
    if (hint.length > HINT_MAX_LENGTH) {
      return res.status(400).json({
        success: false,
        message: validationMessage(req, 'HINT_TOO_LONG')
      });
    }

    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const recentBatches = await countRecentAiStyleBatches(page.id, 1);
    if (recentBatches >= RATE_LIMIT_BATCHES_PER_HOUR) {
      return res.status(429).json({
        success: false,
        message: req.t('pages.theme.aiStyle.rateLimit')
      });
    }

    const uploaded = await uploadPageBrand(page.id, req.file);
    const styles = await generateAiThemeStyles(req.file, hint);
    const batchId = newBatchId();

    const saved = await insertAiStyleBatch(page.id, {
      batchId,
      sourceImageUrl: uploaded.url,
      hint: hint || null,
      styles
    });

    return res.status(200).json({
      success: true,
      message: req.t('pages.theme.aiStyle.generateSuccess'),
      data: {
        batch_id: saved.batch_id,
        source: {
          image_url: uploaded.url,
          hint: hint || null
        },
        styles: saved.styles
      }
    });
  } catch (error) {
    console.error('AI style generate error:', error);
    const mapped = mapAiStyleError(req, res, error);
    if (mapped) return mapped;

    return res.status(500).json({
      success: false,
      message: req.t('pages.theme.aiStyle.generateError')
    });
  }
}

export async function listPageAiStylesHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const styles = await listPageAiStyles(page.id);

    return res.status(200).json({
      success: true,
      data: { styles }
    });
  } catch (error) {
    console.error('AI style list error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('pages.theme.aiStyle.listError')
    });
  }
}

export async function applyPageAiStyleHandler(req, res) {
  try {
    const page = await requireOwnedPage(req, res);
    if (!page) return;

    const styleId = req.body?.style_id ?? req.body?.styleId;
    if (!isValidStyleId(styleId)) {
      return res.status(400).json({
        success: false,
        message: validationMessage(req, 'STYLE_ID_INVALID')
      });
    }

    const result = await applyPageAiStyle(page.id, styleId.trim());
    if (!result) {
      return res.status(400).json({
        success: false,
        message: validationMessage(req, 'STYLE_ID_INVALID')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.theme.aiStyle.applySuccess'),
      data: result
    });
  } catch (error) {
    console.error('AI style apply error:', error);
    const mapped = mapAiStyleError(req, res, error);
    if (mapped) return mapped;

    return res.status(500).json({
      success: false,
      message: req.t('pages.theme.aiStyle.applyError')
    });
  }
}
