import ru from '../locales/ru.js';
import en from '../locales/en.js';

const locales = {
  ru: ru.default || ru,
  en: en.default || en
};

export function localeMiddleware(req, res, next) {
  const acceptLanguage = req.headers['accept-language'] || 'en';

  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [language, quality = '1'] = lang.trim().split(';q=');
      return {
        lang: language.split('-')[0],
        quality: parseFloat(quality)
      };
    })
    .sort((a, b) => b.quality - a.quality);

  const supportedLanguages = ['ru', 'en'];
  let currentLang = 'en';

  for (const { lang } of languages) {
    if (supportedLanguages.includes(lang)) {
      currentLang = lang;
      break;
    }
  }

  req.t = (key, params = {}) => {
    const keys = key.split('.');
    let value = locales[currentLang] || locales.en;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else if (currentLang !== 'en') {
        let fallbackValue = locales.en;
        let found = true;
        for (const fk of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
            fallbackValue = fallbackValue[fk];
          } else {
            found = false;
            break;
          }
        }
        if (found && typeof fallbackValue === 'string') {
          value = fallbackValue;
          break;
        }
        return key;
      } else {
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    let result = value;
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue);
    }
    return result;
  };

  req.lang = currentLang;
  next();
}
