type UnsavedChangeGuard = () => Promise<boolean>;

const guards: UnsavedChangeGuard[] = [];

export function registerUnsavedChangeGuard(guard: UnsavedChangeGuard) {
  guards.push(guard);
  return () => {
    const index = guards.lastIndexOf(guard);
    if (index !== -1) guards.splice(index, 1);
  };
}

export function hasUnsavedChanges() {
  return guards.length > 0;
}

export function confirmUnsavedNavigation() {
  return guards.at(-1)?.() ?? Promise.resolve(true);
}
