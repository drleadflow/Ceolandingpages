import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FunnelProvider } from "./contexts/FunnelContext";
import Home from "./pages/Home";
import SmartQuiz from "./pages/SmartQuiz";
import Dashboard from "./pages/Dashboard";
import AdminLeads from "./pages/AdminLeads";
import AdminLayout from "./pages/admin/AdminLayout";
import FunnelProducts from "./pages/admin/FunnelProducts";
import FunnelPageEditor from "./pages/admin/FunnelPageEditor";
import FunnelAnalytics from "./pages/admin/FunnelAnalytics";
import FunnelSplitTests from "./pages/admin/FunnelSplitTests";
import TrackingSettings from "./pages/admin/TrackingSettings";
import VideoLibrary from "./pages/admin/VideoLibrary";
import VideoAnalytics from "./pages/admin/VideoAnalytics";
import PublicRoadmap from "./pages/PublicRoadmap";
import SharedPlaybook from "./pages/SharedPlaybook";
import SalesPage from "./pages/funnel/SalesPage";
import UpsellPage from "./pages/funnel/UpsellPage";
import DownsellPage from "./pages/funnel/DownsellPage";
import ThankYouPage from "./pages/funnel/ThankYouPage";
import BookingPage from "./pages/funnel/BookingPage";
import CallPrepPage from "./pages/funnel/CallPrepPage";
import AgencyPage from "./pages/funnel/AgencyPage";
import VideoPlayerPage from "./pages/funnel/VideoPlayerPage";
import FunnelList from "./pages/admin/FunnelList";
import FunnelBuilder from "./pages/admin/FunnelBuilder";
import FunnelStepAnalytics from "./pages/admin/FunnelStepAnalytics";
import FunnelTemplates from "./pages/admin/FunnelTemplates";
import DynamicFunnel from "./pages/funnel/DynamicFunnel";
import MasterclassOptIn from "./pages/funnel/MasterclassOptIn";
import RoadmapInfo from "./pages/RoadmapInfo";
import SettingsPage from "./pages/admin/SettingsPage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/quiz"} component={SmartQuiz} />
      <Route path="/dashboard/:id" component={Dashboard} />
      <Route path="/roadmap/:shareCode" component={PublicRoadmap} />
      <Route path="/playbook/:token" component={SharedPlaybook} />
      <Route path="/fb-ads-course" component={SalesPage} />
      <Route path="/offer/vault" component={UpsellPage} />
      <Route path="/offer/session" component={DownsellPage} />
      <Route path="/thank-you" component={ThankYouPage} />
      <Route path="/book-session" component={BookingPage} />
      <Route path="/call-prep" component={CallPrepPage} />
      <Route path="/masterclass" component={MasterclassOptIn} />
      <Route path="/roadmap-info" component={RoadmapInfo} />
      <Route path="/agency" component={AgencyPage} />
      <Route path="/v/:playbackId" component={VideoPlayerPage} />
      <Route path="/admin/builder/:id/analytics">
        <FunnelStepAnalytics />
      </Route>
      <Route path="/admin/builder/:id">
        <FunnelBuilder />
      </Route>
      <Route path="/admin/builder">
        <AdminLayout><FunnelList /></AdminLayout>
      </Route>
      <Route path="/admin/templates">
        <AdminLayout><FunnelTemplates /></AdminLayout>
      </Route>
      <Route path="/admin/leads">
        <AdminLayout><AdminLeads /></AdminLayout>
      </Route>
      <Route path="/admin/funnel/products">
        <AdminLayout><FunnelProducts /></AdminLayout>
      </Route>
      <Route path="/admin/funnel/pages">
        <AdminLayout><FunnelPageEditor /></AdminLayout>
      </Route>
      <Route path="/admin/funnel/analytics">
        <AdminLayout><FunnelAnalytics /></AdminLayout>
      </Route>
      <Route path="/admin/funnel/split-tests">
        <AdminLayout><FunnelSplitTests /></AdminLayout>
      </Route>
      <Route path="/admin/funnel/tracking">
        <AdminLayout><TrackingSettings /></AdminLayout>
      </Route>
      <Route path="/admin/video-library">
        <AdminLayout><VideoLibrary /></AdminLayout>
      </Route>
      <Route path="/admin/video-analytics">
        <AdminLayout><VideoAnalytics /></AdminLayout>
      </Route>
      <Route path="/admin/settings">
        <AdminLayout><SettingsPage /></AdminLayout>
      </Route>
      <Route path="/admin">
        <AdminLayout><AdminLeads /></AdminLayout>
      </Route>
      <Route path="/f/:slug" component={DynamicFunnel} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <FunnelProvider>
            <Router />
          </FunnelProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
