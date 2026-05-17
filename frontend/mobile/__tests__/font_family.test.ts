/**
 * Locale-conditional font resolver (Phase 2, design-system migration).
 *
 * This is real branching logic on a runtime-changeable input (the
 * active i18n language), not a token table — so it is unit-tested.
 * EN (and anything non-Arabic) -> Livvic; Arabic -> Cairo.
 */
import { fontFamilyFor } from '../src/presentation/themes/typography';

describe('fontFamilyFor', () => {
  it('returns the Livvic family for English', () => {
    const f = fontFamilyFor('en');
    expect(f.regular).toBe('Livvic-Regular');
    expect(f.medium).toBe('Livvic-Medium');
    expect(f.semibold).toBe('Livvic-SemiBold');
    expect(f.bold).toBe('Livvic-Bold');
  });

  it('returns the Cairo family for Arabic', () => {
    const f = fontFamilyFor('ar');
    expect(f.regular).toBe('Cairo-Regular');
    expect(f.medium).toBe('Cairo-Medium');
    expect(f.semibold).toBe('Cairo-SemiBold');
    expect(f.bold).toBe('Cairo-Bold');
  });

  it('treats a BCP-47 Arabic region tag (ar-EG) as Arabic', () => {
    expect(fontFamilyFor('ar-EG').regular).toBe('Cairo-Regular');
  });

  it('defaults to Livvic for empty or undefined language', () => {
    expect(fontFamilyFor('').regular).toBe('Livvic-Regular');
    expect(fontFamilyFor(undefined).regular).toBe('Livvic-Regular');
  });

  it('exposes exactly the four weight keys', () => {
    expect(Object.keys(fontFamilyFor('en')).sort()).toEqual(
      ['bold', 'medium', 'regular', 'semibold'].sort(),
    );
  });
});
