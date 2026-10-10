import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CommissionPage from '../../../src/pages/admin/CommissionPage';

vi.mock('../../../src/features/reports/api/reportApi', () => ({
    reportApi: {
        getPlatformRevenue: vi.fn(() => Promise.resolve({
            totalRevenue: 5000,
            revenueByDate: []
        }))
    }
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

describe('CommissionRevenue (CommissionPage)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should load commission and revenue data without crashing', async () => {
        renderWithProviders(<CommissionPage />);
        
        await waitFor(() => {
            const headings = screen.getAllByRole('heading');
            expect(headings.length).toBeGreaterThan(0);
        });
    });
});
