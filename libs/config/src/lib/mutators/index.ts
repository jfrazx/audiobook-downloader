export function isTrueMutator(value: string | boolean): boolean {
  return value?.toString() === 'true';
}
