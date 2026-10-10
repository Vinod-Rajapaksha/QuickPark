import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UsersPage from '../../../src/pages/admin/UsersPage';

vi.mock('../../../src/features/users/api/userApi', () => ({
    getUsers: vi.fn(() => Promise.resolve({
        data: [{ id: '1', fullName: 'John Doe', email: 'john@example.com', role: 'DRIVER', isActive: true }],
        total: 1,
        page: 1,
        limit: 10
    }))
}));

vi.mock('../../../src/hooks/useAuth', () => ({
    useAuth: vi.fn(() => ({
        user: { id: 'admin-1', role: 'PLATFORM_ADMIN' },
        isAuthenticated: true,
        isLoading: false
    }))
}));

vi.mock('../../../src/hooks/useToast', () => ({
    useToast: () => ({ showToast: vi.fn() })
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const renderWithProviders = (ui: React.ReactElement) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {ui}
            </BrowserRouter>
        </QueryClientProvider>
    );
};

describe('UserManagement (UsersPage)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should list users with their details', async () => {
        renderWithProviders(<UsersPage />);
        
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('john@example.com')).toBeInTheDocument();
        });
    });

    it('should render a search input to find users', async () => {
        renderWithProviders(<UsersPage />);
        
        await waitFor(() => {
            const searchInput = screen.getByPlaceholderText(/search/i);
            expect(searchInput).toBeInTheDocument();
        });
    });
});
