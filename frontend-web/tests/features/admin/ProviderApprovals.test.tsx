import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FacilityReviewPage from '../../../src/pages/admin/FacilityReviewPage';

vi.mock('../../../src/features/parking/hooks/useFacilityReviews', () => ({
    useFacilityQueue: () => ({
        rows: [{ facility: { facilityId: '1', name: 'Test Facility' } }]
    }),
    useFacilityDetail: () => ({
        facility: { id: '1', name: 'Test Facility', address: '123 Test St', sections: [], missingRequirements: [] },
        review: { id: '1', status: 'PENDING' },
        isLoading: false
    })
}));

vi.mock('../../../src/hooks/useToast', () => ({
    useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() })
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

describe('ProviderApprovals (FacilityReviewPage)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should display pending facilities/providers for review', async () => {
        renderWithProviders(<FacilityReviewPage />);
        
        await waitFor(() => {
            expect(screen.getByText('Test Facility')).toBeInTheDocument();
        });
    });
});
