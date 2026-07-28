import { isStaleAssetError } from './staleAssetRecovery';

describe('isStaleAssetError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://rilaksekai.com/static/js/CardPage.js',
    'ChunkLoadError: Loading chunk 25 failed.',
    'Importing a module script failed.',
  ])('recognizes a stale deployment asset error: %s', (message) => {
    expect(isStaleAssetError(new Error(message))).toBe(true);
  });

  it('does not reload for unrelated runtime errors', () => {
    expect(isStaleAssetError(new Error('Cannot read properties of undefined'))).toBe(false);
  });
});
