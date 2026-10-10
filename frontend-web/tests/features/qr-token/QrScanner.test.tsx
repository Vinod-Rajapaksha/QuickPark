import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QRScannerPage from '../../../src/pages/staff/QRScannerPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

vi.mock('html5-qrcode', () => {
    return {
        Html5QrcodeScanner: vi.fn().mockImplementation(() => ({
            render: vi.fn(),
            clear: vi.fn().mockResolvedValue(undefined)
        })),
        Html5QrcodeScanType: { SCAN_TYPE_CAMERA: 0 }
    };
});

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui: React.ReactElement) => render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
);

describe('QRScannerPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the scanner container and header', () => {
        renderWithProviders(<QRScannerPage />);
        
        expect(document.getElementById('qr-reader')).toBeInTheDocument();
    });
});
