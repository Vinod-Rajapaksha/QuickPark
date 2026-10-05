import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { TestProviders } from './TestProviders';

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestProviders, ...options });

export { screen, fireEvent, waitFor } from '@testing-library/react';
export { customRender as render };
