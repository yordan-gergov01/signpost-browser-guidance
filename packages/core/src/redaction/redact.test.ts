import { describe as suite, expect, test } from 'vitest';
import { redactText, totalRedactions } from '@hintora/core/redaction/redact';

suite('redactText', () => {
  test.each([
    ['email', 'Message ada@analytical.io now', '[email]'],
    ['phone', 'Call +44 7700 900123 today', '[phone]'],
    ['iban', 'Send to GB29NWBK60161331926819 please', '[iban]'],
    ['card', 'Card 4111 1111 1111 1111 on file', '[card]'],
    ['long number', 'Account 123456789 is active', '[number]'],
    ['jwt', 'Bearer eyJhbGci.eyJzdWIi.SflKxwRJ here', '[token]'],
  ])('replaces %s', (_kind, input, placeholder) => {
    const { text, report } = redactText(input);
    expect(text).toContain(placeholder);
    expect(totalRedactions(report)).toBeGreaterThan(0);
  });

  test('leaves the surrounding label intact', () => {
    expect(redactText('Email Ada at ada@analytical.io').text).toBe(
      'Email Ada at [email]',
    );
  });

  test('counts every class it found', () => {
    const { report } = redactText('ada@analytical.io and grace@navy.mil');
    expect(report.email).toBe(2);
  });

  test('leaves ordinary interface copy alone', () => {
    const untouched = [
      'Save changes',
      '6 of 6 shown',
      '128 rows',
      'Next renewal on 1 February 2027',
      'Team - 12 seats',
      'ak_live_9f2c',
    ];

    for (const label of untouched) {
      const { text, report } = redactText(label);
      expect(text).toBe(label);
      expect(totalRedactions(report)).toBe(0);
    }
  });
});
