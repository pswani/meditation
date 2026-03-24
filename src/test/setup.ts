import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { afterEach, beforeEach, expect } from 'vitest';

expect.extend(matchers);

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});
