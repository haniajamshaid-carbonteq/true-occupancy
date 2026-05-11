/* global React, ReactRouterDOM, HomeScreen, ScanStartScreen, ScanMidScreen,
   ResultCleanScreen, ResultMediumScreen, ResultHighScreen,
   WhyExpandedScreen, ComponentsPage, BatchScreen, HistoryScreen,
   SignInScreen, SignUpScreen, CommandPalette */
// Top-level router. Each route = one screen.
// HashRouter so the static server doesn't need URL-rewriting config.

const { HashRouter, Switch, Route, Redirect, useLocation } = ReactRouterDOM;

// Crossfades the routed screen on every navigation. Keyed by pathname so a
// new wrapper mounts on each route change → the .route-fade-in keyframe
// fires (200ms fade + 8px lift). Auth routes opt out — they have their
// own sliding panel animation — and share a stable key so toggling between
// /signin and /signup does NOT unmount the AuthScreen (otherwise the CSS
// slide transition has no prior state to animate from and just snaps).
function RouteCrossfade({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuth = location.pathname === '/signin' || location.pathname === '/signup';
  const wrapperKey = isAuth ? 'auth' : location.pathname;
  return (
    <div key={wrapperKey} className={isAuth ? '' : 'route-fade-in'}>
      {children}
    </div>
  );
}

// Specific routes first; "/" is matched with `exact` so it doesn't swallow
// nested paths. Order matters with v5's Switch.
const ROUTES = [
  { path: '/batch',          component: BatchScreen },
  { path: '/history',        component: HistoryScreen },
  { path: '/scan/start',     component: ScanStartScreen },
  { path: '/scan/mid',       component: ScanMidScreen },
  { path: '/result/clean',   component: ResultCleanScreen },
  { path: '/result/medium',  component: ResultMediumScreen },
  { path: '/result/high',    component: ResultHighScreen },
  { path: '/why-expanded',   component: WhyExpandedScreen },
  { path: '/components',     component: ComponentsPage },
  // Both auth paths share one Route → one AuthScreen instance persists
  // across the toggle so the slide CSS transition has prior state.
  { path: ['/signin', '/signup'], component: SignInScreen },
];

function App() {
  return (
    <HashRouter>
      <CommandPalette />
      <RouteCrossfade>
        <Switch>
          {ROUTES.map((r) => (
            <Route key={r.path} path={r.path} component={r.component} />
          ))}
          <Route path="/" exact component={HomeScreen} />
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </RouteCrossfade>
    </HashRouter>
  );
}
