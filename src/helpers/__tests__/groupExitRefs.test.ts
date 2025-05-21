import { describe, expect, it } from 'vitest';
import { groupExitRefs } from '../groupExitRefs';

describe('groupExitRefs', () => {
  it.each`
    input             | output
    ${'1'}            | ${['1']}
    ${'123'}          | ${[['1', '3']]}
    ${'13'}           | ${['1', '3']}
    ${'1345679'}      | ${['1', ['3', '7'], '9']}
    ${'A'}            | ${['A']}
    ${'AB'}           | ${[['A', 'B']]}
    ${'ABCDE'}        | ${[['A', 'E']]}
    ${'ACDEFGIKLMPQ'} | ${['A', ['C', 'G'], 'I', ['K', 'M'], ['P', 'Q']]}
  `('converts $input to $output', ({ input, output }) => {
    expect(groupExitRefs([...input])).toStrictEqual(output);
  });
});
