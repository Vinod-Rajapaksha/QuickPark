import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AgentChatView } from '../../../src/features/agent/components/AgentChatView';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../src/hooks/useAuth', () => ({
    useAuth: vi.fn(() => ({
        user: { id: 'user-1', role: 'DRIVER' },
        isAuthenticated: true,
        isLoading: false
    }))
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

window.HTMLElement.prototype.scrollIntoView = vi.fn();

const renderWithProviders = (ui: React.ReactElement) => render(
    <QueryClientProvider client={queryClient}>
        {ui}
    </QueryClientProvider>
);

describe('AgentChatView (AI Chat Widget)', () => {
    it('should render the chat interface', () => {
        renderWithProviders(<AgentChatView />);
        
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
});
