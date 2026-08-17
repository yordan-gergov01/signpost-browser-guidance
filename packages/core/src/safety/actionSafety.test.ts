import { describe as suite, expect, test } from 'vitest';
import { classifyAction, requiresConfirmation } from '@signpost/core/safety/actionSafety';

suite('classifyAction', () => {
  test.each([
    ['Delete account', 'irreversible'],
    ['Cancel subscription', 'irreversible'],
    ['Deactivate workspace', 'irreversible'],
    ['Transfer ownership', 'irreversible'],
    ['Remove contact', 'destructive'],
    ['Revoke Production key', 'destructive'],
    ['Reset password', 'destructive'],
    ['Save changes', 'safe'],
    ['Add contact', 'safe'],
    ['Export', 'safe'],
  ])('classifies %s as %s', (name, expected) => {
    expect(classifyAction({ name }).risk).toBe(expected);
  });

  test('does not confuse a dialog Cancel with cancelling a subscription', () => {
    expect(classifyAction({ name: 'Cancel' }).risk).toBe('safe');
    expect(classifyAction({ name: 'Cancel subscription' }).risk).toBe('irreversible');
  });

  test('reports the phrase that triggered it, for the confirmation copy', () => {
    expect(classifyAction({ name: 'Delete account' }).matched).toBe('Delete');
  });

  test('anything not safe needs an explicit confirmation', () => {
    expect(requiresConfirmation(classifyAction({ name: 'Delete account' }))).toBe(true);
    expect(requiresConfirmation(classifyAction({ name: 'Save changes' }))).toBe(false);
  });
});
