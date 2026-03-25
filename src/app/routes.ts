import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/root-layout';
import { Layout } from './components/layout';
import { HomePage } from './components/home-page';
import { LoginPage } from './components/login-page';
import { SignupPage } from './components/signup-page';
import { ForgotPasswordPage } from './components/forgot-password-page';
import { BrowseEventsPage } from './components/browse-events-page';
import { SubmitEventPage } from './components/submit-event-page';
import { SubmittedEventsPage } from './components/submitted-events-page';
import { FavoritesPage } from './components/favorites-page';
import { MyRsvpsPage } from './components/my-rsvps-page';
import { AboutPage } from './components/about-page';
import { HelpCenterPage } from './components/help-center-page';
import { TermsPage } from './components/terms-page';
import { PrivacyPage } from './components/privacy-page';
import { AdminPage } from './components/admin-page';
import { ContactOrganizerPage } from './components/contact-organizer-page';
import { MyMessagesPage } from './components/my-messages-page';
import { MyDraftsPage } from './components/my-drafts-page';
import { EventDetailPage } from './components/event-detail-page';
import { NotFoundPage } from './components/not-found-page';

// Router configuration for EventGO app
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: HomePage },
          { path: 'event/:eventId', Component: EventDetailPage },
          { path: 'login', Component: LoginPage },
          { path: 'signup', Component: SignupPage },
          { path: 'forgot-password', Component: ForgotPasswordPage },
          { path: 'browse', Component: BrowseEventsPage },
          { path: 'submit', Component: SubmitEventPage },
          { path: 'my-events', Component: SubmittedEventsPage },
          { path: 'favorites', Component: FavoritesPage },
          { path: 'my-rsvps', Component: MyRsvpsPage },
          { path: 'about', Component: AboutPage },
          { path: 'help', Component: HelpCenterPage },
          { path: 'terms', Component: TermsPage },
          { path: 'privacy', Component: PrivacyPage },
          { path: 'admin', Component: AdminPage },
          { path: 'contact-organizer', Component: ContactOrganizerPage },
          { path: 'my-messages', Component: MyMessagesPage },
          { path: 'my-drafts', Component: MyDraftsPage },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
]);