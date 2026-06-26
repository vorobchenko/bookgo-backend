const INTERNAL_TO_API = {
  cancellationPolicy: 'cancellation_policy',
  customQuestions: 'custom_questions'
};

const API_TO_INTERNAL = Object.fromEntries(
  Object.entries(INTERNAL_TO_API).map(([internal, api]) => [api, internal])
);

export function blockTypeToApi(type) {
  return INTERNAL_TO_API[type] ?? type;
}

export function blockTypeFromApi(type) {
  return API_TO_INTERNAL[type] ?? type;
}
