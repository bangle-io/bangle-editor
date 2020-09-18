// Focus is not really working for unit tests
// so this exists for easier mocking
export function viewHasFocus(view) {
  return view.hasFocus();
}
