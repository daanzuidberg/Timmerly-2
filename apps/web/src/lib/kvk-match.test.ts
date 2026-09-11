import { describe, expect, it } from 'vitest';
import { namesRoughlyMatch } from './kvk-match';

describe('namesRoughlyMatch', () => {
  it('negeert hoofdletters, spaties en leestekens', () => {
    expect(namesRoughlyMatch('Van Dijk Bouw B.V.', 'van dijk bouw bv')).toBe(true);
    expect(namesRoughlyMatch('Janssen Bouw', 'Janssen Bouw B.V.')).toBe(true);
  });

  it('wijst duidelijk andere namen af', () => {
    expect(namesRoughlyMatch('Van Dijk Bouw B.V.', 'Kroon Bouw & Infra')).toBe(false);
  });

  it('behandelt een lege opgegeven naam als geen match', () => {
    expect(namesRoughlyMatch('', 'Janssen Bouw')).toBe(false);
  });
});
