import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FunnelProvider } from "./contexts/FunnelContext";

// Masterclass + SalesPage loaded eagerly (ad traffic landing pages)
import MasterclassOptIn from "./pages/funnel/MasterclassOptIn";
import SalesPage from "./pages/funnel/SalesPage";

// Everything else lazy-loaded — only fetched when the route is visited
const Home = lazy(() => import("./pages/Home"));
const SmartQuiz = lazy(() => import("./pages/SmartQuiz"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const FunnelProducts = lazy(() => import("./pages/admin/FunnelProducts"));
const FunnelPageEditor = lazy(() => import("./pages/admin/FunnelPageEditor"));
const FunnelAnalytics = lazy(() => import("./pages/admin/FunnelAnalytics"));
const FunnelSplitTests = lazy(() => import("./pages/admin/FunnelSplitTests"));
const TrackingSettings = lazy(() => import("./pages/admin/TrackingSettings"));
const VideoLibrary = lazy(() => import("./pages/admin/VideoLibrary"));
const VideoAnalytics = lazy(() => import("./pages/admin/VideoAnalytics"));
const MasterclassAnalytics = lazy(() => import("./pages/admin/MasterclassAnalytics"));
const PublicRoadmap = lazy(() => import("./pages/PublicRoadmap"));
const SharedPlaybook = lazy(() => import("./pages/SharedPlaybook"));
const UpsellPage = lazy(() => import("./pages/funnel/UpsellPage"));
const DownsellPage = lazy(() => import("./pages/funnel/DownsellPage"));
const ThankYouPage = lazy(() => import("./pages/funnel/ThankYouPage"));
const BookingPage = lazy(() => import("./pages/funnel/BookingPage"));
const CallPrepPage = lazy(() => import("./pages/funnel/CallPrepPage"));
const AgencyPage = lazy(() => import("./pages/funnel/AgencyPage"));
const VideoPlayerPage = lazy(() => import("./pages/funnel/VideoPlayerPage"));
const FunnelList = lazy(() => import("./pages/admin/FunnelList"));
const FunnelBuilder = lazy(() => import("./pages/admin/FunnelBuilder"));
const FunnelStepAnalytics = lazy(() => import("./pages/admin/FunnelStepAnalytics"));
const FunnelTemplates = lazy(() => import("./pages/admin/FunnelTemplates"));
const DynamicFunnel = lazy(() => import("./pages/funnel/DynamicFunnel"));
const RoadmapInfo = lazy(() => import("./pages/RoadmapInfo"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

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
      <Route path="/admin/masterclass">
        <AdminLayout><MasterclassAnalytics /></AdminLayout>
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

function LazyFallback() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "sp .6s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#64748b", fontSize: 14, fontFamily: "system-ui, sans-serif" }}>Loading...</p>
      </div>
    </div>
  );
}

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
            <Suspense fallback={<LazyFallback />}>
              <Router />
            </Suspense>
          </FunnelProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
