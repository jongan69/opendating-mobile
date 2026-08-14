import { expect, test } from 'bun:test';

import { escapeTemplateLiteral, extractNamecheapErrors } from './security-utils.mjs';

test('extracts Namecheap error text without retaining markup', () => {
  expect(extractNamecheapErrors('<Errors><Error Number="1">Bad &amp; costly</Error></Errors>'))
    .toEqual(['Bad & costly']);
  expect(extractNamecheapErrors('<Error><script>alert(1)</script></Error>')).toEqual([]);
});

test('escapes template literal control characters', () => {
  expect(escapeTemplateLiteral('path\\name ` ${value} $plain'))
    .toBe('path\\\\name \\` \\${value} $plain');
});
