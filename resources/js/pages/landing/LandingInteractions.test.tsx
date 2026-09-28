import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { metaApi } from '@/api/meta.api';
import type { MetaResponse } from '@/types/reference.types';
import { landingContent } from '../../../../src/data/landingContent';
import { FeatureTabs } from '../../../../src/components/landing/FeatureTabs';
import { StatCounter } from '../../../../src/components/landing/StatCounter';
import { CaseStudyCarousel } from '../../../../src/components/landing/CaseStudyCarousel';

vi.mock('@/api/meta.api', () => ({
  metaApi: { get: vi.fn() },
}));

const hu = landingContent.hu;

const buildMeta = (total?: number | null): MetaResponse => ({
  catalog: total !== undefined && total !== null ? { counts: { total } } : null,
  reference: { regions: [], industries: [], goals: [], revBands: [], orgTypes: [] },
  labels: { programmes: {}, actions: {} },
  optionalProfileFields: [],
  today: '2026-09-27',
});

describe('LandingInteractions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FeatureTabs and local NAV validation', () => {
    it('provides honest local CDV validation without making network requests', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FeatureTabs copy={hu.features} />);

      // Switch to NAV tab
      await user.click(screen.getByRole('tab', { name: hu.features.tabs[2] }));

      const input = screen.getByLabelText(hu.features.nav.taxLabel);
      const submitBtn = screen.getByRole('button', { name: hu.features.nav.submit });

      // Empty submission
      await user.click(submitBtn);
      expect(screen.getByText(hu.features.nav.required)).toBeInTheDocument();

      // Invalid tax number (bad check digit)
      await user.type(input, '12345674');
      await user.click(submitBtn);
      expect(screen.getByText(hu.features.nav.invalid)).toBeInTheDocument();

      // Valid 8-digit tax number
      await user.clear(input);
      await user.type(input, '12345676');
      expect(screen.getByText(hu.features.nav.valid)).toBeInTheDocument();

      // Valid 11-digit formatted tax number
      await user.clear(input);
      await user.type(input, '12345676-2-42');
      expect(screen.getByText(hu.features.nav.valid)).toBeInTheDocument();

      // Pasted invalid letters are preserved, not stripped away
      await user.clear(input);
      await user.type(input, '1234abcd');
      expect(input).toHaveValue('1234abcd');
      expect(screen.getByText(hu.features.nav.invalid)).toBeInTheDocument();

      // Loading sample sets illustrative sample data
      await user.click(screen.getByRole('button', { name: hu.features.nav.sample }));
      expect(input).toHaveValue(hu.features.nav.sampleNumber);
      expect(screen.getByText(hu.features.nav.sampleName)).toBeInTheDocument();
      expect(screen.getByText(hu.features.nav.sampleNote)).toBeInTheDocument();

      // Manual edit clears the sample company name
      await user.type(input, '0');
      expect(screen.queryByText(hu.features.nav.sampleName)).not.toBeInTheDocument();
    });

    it('manages tab keyboard navigation with roving tabindex and wrapped arrows', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FeatureTabs copy={hu.features} />);

      const tab1 = screen.getByRole('tab', { name: hu.features.tabs[0] });
      const tab2 = screen.getByRole('tab', { name: hu.features.tabs[1] });
      const tab3 = screen.getByRole('tab', { name: hu.features.tabs[2] });

      tab1.focus();
      expect(tab1).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(tab2).toHaveFocus();
      expect(tab2).toHaveAttribute('aria-selected', 'true');

      await user.keyboard('{ArrowRight}');
      expect(tab3).toHaveFocus();
      expect(tab3).toHaveAttribute('aria-selected', 'true');

      // Wrap around
      await user.keyboard('{ArrowRight}');
      expect(tab1).toHaveFocus();

      // Home and End
      await user.keyboard('{End}');
      expect(tab3).toHaveFocus();

      await user.keyboard('{Home}');
      expect(tab1).toHaveFocus();
    });
  });

  describe('StatCounter with catalogue metadata', () => {
    it('displays positive catalogue count correctly', async () => {
      vi.mocked(metaApi.get).mockResolvedValue(buildMeta(42));
      renderWithProviders(<StatCounter copy={hu.stats} lang="hu" />);

      expect(await screen.findByText('42')).toBeInTheDocument();
      expect(screen.getByText(hu.stats.label)).toBeInTheDocument();
      expect(screen.getByText(hu.stats.source)).toBeInTheDocument();
    });

    it('displays explicit zero without treating it as missing', async () => {
      vi.mocked(metaApi.get).mockResolvedValue(buildMeta(0));
      renderWithProviders(<StatCounter copy={hu.stats} lang="hu" />);

      expect(await screen.findByText('0')).toBeInTheDocument();
    });

    it('displays unavailable message when catalogue is null or missing count', async () => {
      vi.mocked(metaApi.get).mockResolvedValue(buildMeta(null));
      renderWithProviders(<StatCounter copy={hu.stats} lang="hu" />);

      expect(await screen.findByText(hu.stats.empty)).toBeInTheDocument();
    });

    it('renders actionable error and allows successful retry', async () => {
      const user = userEvent.setup();
      vi.mocked(metaApi.get).mockRejectedValueOnce(new Error('Network error'));
      renderWithProviders(<StatCounter copy={hu.stats} lang="hu" />);

      expect(await screen.findByText(hu.stats.error)).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: hu.stats.retry });

      vi.mocked(metaApi.get).mockResolvedValue(buildMeta(99));
      await user.click(retryBtn);

      expect(await screen.findByText('99')).toBeInTheDocument();
    });
  });

  describe('CaseStudyCarousel interactions', () => {
    it('advances, wraps, and updates active slide via manual controls', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CaseStudyCarousel copy={hu.cases} />);

      const slides = hu.cases.slides;
      expect(screen.getByText(slides[0].title)).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(`1 / ${slides.length}`);

      const nextBtn = screen.getByRole('button', { name: hu.cases.next });
      const prevBtn = screen.getByRole('button', { name: hu.cases.previous });

      await user.click(nextBtn);
      expect(screen.getByText(slides[1].title)).toBeInTheDocument();
      expect(screen.queryByText(slides[0].title)).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(`2 / ${slides.length}`);

      // Previous wraps to last slide from first slide
      await user.click(prevBtn);
      expect(screen.getByText(slides[0].title)).toBeInTheDocument();

      await user.click(prevBtn);
      expect(screen.getByText(slides[slides.length - 1].title)).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(`${slides.length} / ${slides.length}`);
    });

    it('autoplays on an interval and pauses while hovered', () => {
      vi.useFakeTimers();
      try {
        const { container } = renderWithProviders(<CaseStudyCarousel copy={hu.cases} />);
        const slides = hu.cases.slides;
        const section = container.querySelector('section')!;

        expect(screen.getByText(slides[0].title)).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(6000);
        });
        expect(screen.getByText(slides[1].title)).toBeInTheDocument();

        fireEvent.mouseEnter(section);
        act(() => {
          vi.advanceTimersByTime(6000);
        });
        // Hovered: the timer that would advance to slide 3 never fires.
        expect(screen.getByText(slides[1].title)).toBeInTheDocument();

        fireEvent.mouseLeave(section);
        act(() => {
          vi.advanceTimersByTime(6000);
        });
        expect(screen.getByText(slides[2 % slides.length].title)).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
