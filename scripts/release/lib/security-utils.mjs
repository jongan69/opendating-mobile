const XML_ENTITIES = new Map([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', "'"],
  ['#39', "'"],
]);

const decodeXmlEntities = (value) => value.replace(
  /&(amp|lt|gt|quot|apos|#39);/g,
  (entity, name) => XML_ENTITIES.get(name) ?? entity,
);

export function extractNamecheapErrors(xml) {
  return Array.from(
    String(xml).matchAll(/<Error\b[^>]*>([^<]*)<\/Error>/gi),
    (match) => decodeXmlEntities(match[1]).replace(/[\u0000-\u001f\u007f]/g, ' ').trim(),
  ).filter(Boolean);
}

export function escapeTemplateLiteral(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}
