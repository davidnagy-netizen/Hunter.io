/**
 * Main application client entry point for Fundor.hu.
 * Mounts React components dynamically into Blade views with SSR/server JSON props.
 */

import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';

// Page components
import HomePage from './pages/HomePage';
import AssessmentPage from './pages/AssessmentPage';
import DashboardPage from './pages/DashboardPage';
import OpportunitiesIndexPage from './pages/OpportunitiesIndexPage';
import OpportunityShowPage from './pages/OpportunityShowPage';
import CalendarPage from './pages/CalendarPage';
import FavoritesPage from './pages/FavoritesPage';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCrmPage from './pages/AdminCrmPage';

// Shared UI primitives
import GrantCalculator from './components/GrantCalculator';
import ScoreBreakdown from './components/ScoreBreakdown';
import FaqAccordion from './components/FaqAccordion';
import LanguageSwitcher from './components/LanguageSwitcher';
import Navbar from './components/Navbar';
import Button from './components/Button';
import Badge from './components/Badge';
import Card from './components/Card';

// Component registry mapping names to modules
export const components = {
    HomePage,
    AssessmentPage,
    DashboardPage,
    OpportunitiesIndexPage,
    OpportunityShowPage,
    CalendarPage,
    FavoritesPage,
    OnboardingPage,
    LoginPage,
    RegisterPage,
    AdminDashboardPage,
    AdminUsersPage,
    AdminCrmPage,
    GrantCalculator,
    ScoreBreakdown,
    FaqAccordion,
    LanguageSwitcher,
    Navbar,
    Button,
    Badge,
    Card,
};

/**
 * Parses element properties from data-props or script tag.
 */
function parseProps(element) {
    let props = {};

    const rawProps = element.getAttribute('data-props');
    if (rawProps) {
        try {
            props = JSON.parse(rawProps);
        } catch (e) {
            // In case of HTML entities in attribute
            try {
                const parser = new DOMParser();
                const decoded = parser.parseFromString(rawProps, 'text/html').body.textContent;
                props = JSON.parse(decoded);
            } catch (err) {
                console.warn('Could not parse data-props JSON for element:', element, err);
            }
        }
    } else {
        // Fallback: search for child script tag with type="application/json"
        const script = element.querySelector('script[type="application/json"]');
        if (script) {
            try {
                props = JSON.parse(script.textContent);
            } catch (err) {
                console.warn('Could not parse application/json script for element:', element, err);
            }
        }
    }

    // Always ensure csrfToken and currentLocale are present
    const metaCsrf = document.querySelector('meta[name="csrf-token"]');
    if (metaCsrf && !props.csrfToken) {
        props.csrfToken = metaCsrf.getAttribute('content') || '';
    }

    if (!props.currentLocale && typeof document !== 'undefined') {
        props.currentLocale = document.documentElement.lang || 'hu';
    }

    return props;
}

/**
 * Scans the DOM for mount targets and renders corresponding React components.
 */
export function mountReactComponents() {
    const targets = document.querySelectorAll('[data-react-component], #react-root');

    targets.forEach((element) => {
        // Prevent duplicate mounting
        if (element._reactRoot) {
            return;
        }

        const componentName = element.getAttribute('data-react-component') || element.dataset.reactComponent;
        if (!componentName) {
            return;
        }

        const Component = components[componentName];
        if (!Component) {
            console.error(`React component "${componentName}" was not found in registry.`);
            return;
        }

        const props = parseProps(element);
        const root = createRoot(element);
        root.render(<Component {...props} />);
        element._reactRoot = root;
    });
}

// Auto-mount when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReactComponents);
} else {
    mountReactComponents();
}

console.log('Fundor.hu React architecture initialized.');
