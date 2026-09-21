import { useState, useCallback } from 'react';

/**
 * Validates the Hungarian statutory Check-Digit (CDV) for an 8-digit base tax number.
 *
 * Educational Notes for Junior Developers:
 * Hungarian tax numbers have 8 or 11 characters (e.g. 12345674 or 12345674-2-42).
 * The first 8 digits determine the enterprise base code.
 * The 8th digit is a checksum calculated from the first 7 digits using weights: [9, 7, 3, 1, 9, 7, 3].
 * Check digit = (sum of products) modulo 10.
 *
 * Pre-validating on client-side prevents wasteful API calls to the NAV Online Invoice service.
 *
 * @param {string} taxNumber - The tax number to validate.
 * @returns {boolean} True if the format and CDV checksum are mathematically valid.
 */
export function validateHungarianCdv(taxNumber) {
    if (!taxNumber || typeof taxNumber !== 'string') return false;

    // Remove hyphens, spaces, and non-digit characters
    const digits = taxNumber.replace(/\D/g, '');

    // Must have at least 8 digits
    if (digits.length < 8) return false;

    const weights = [9, 7, 3, 1, 9, 7, 3];
    let sum = 0;

    for (let i = 0; i < 7; i++) {
        sum += parseInt(digits[i], 10) * weights[i];
    }

    const expectedCheckDigit = sum % 10;
    const actualCheckDigit = parseInt(digits[7], 10);

    return expectedCheckDigit === actualCheckDigit;
}

/**
 * Custom React Hook: NAV Taxpayer Lookup with CDV Pre-validation and State Management.
 *
 * Provides reactive states:
 * - `status`: 'idle' | 'loading' | 'success' | 'error'
 * - `data`: Resolved TaxpayerData object (companyName, fullAddress, etc.)
 * - `error`: Localized error message
 *
 * Reference: CR-03 Section 4.3 - Progressive Registration Flow & NAV Integration.
 */
export function useTaxpayerLookup() {
    const [status, setStatus] = useState('idle');
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const lookupTaxpayer = useCallback(async (taxNumber) => {
        const cleanDigits = (taxNumber || '').replace(/\D/g, '');

        if (!cleanDigits) {
            setStatus('idle');
            setData(null);
            setError(null);
            return null;
        }

        // Step 1: Validate length
        if (cleanDigits.length < 8) {
            setStatus('error');
            setError('Az adószámnak legalább 8 számjegyből kell állnia.');
            setData(null);
            return null;
        }

        // Step 2: Validate statutory CDV check-digit
        const isValidCdv = validateHungarianCdv(cleanDigits);
        if (!isValidCdv) {
            setStatus('error');
            setError('Érvénytelen adószám (CDV ellenőrző összeg hiba). Kérjük, ellenőrizze az adószámot!');
            setData(null);
            return null;
        }

        // Step 3: Call backend NAV queryTaxpayer service
        setStatus('loading');
        setError(null);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch('/api/nav/taxpayer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ tax_number: cleanDigits }),
            });

            const result = await response.json();

            if (response.ok && result.success && result.taxpayer) {
                setStatus('success');
                setData(result.taxpayer);
                setError(null);
                return result.taxpayer;
            }

            // Fallback for demo when backend service returns custom error
            throw new Error(result.error || 'A NAV nyilvántartás nem érhető el vagy az adószám nem található.');
        } catch (err) {
            setStatus('error');
            setError(err.message || 'Hiba történt a NAV lekérdezés során.');
            setData(null);
            return null;
        }
    }, []);

    const resetLookup = useCallback(() => {
        setStatus('idle');
        setData(null);
        setError(null);
    }, []);

    return {
        status,
        data,
        error,
        isLoading: status === 'loading',
        isSuccess: status === 'success',
        isError: status === 'error',
        lookupTaxpayer,
        resetLookup,
    };
}
