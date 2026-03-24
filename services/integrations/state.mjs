export function isOAuthStateValid(expectedState, callbackState) {
  return Boolean(expectedState && callbackState && expectedState === callbackState);
}
