/* global React, ReactRouterDOM, HomeScreen, ScanStartScreen, ScanMidScreen,
   ResultCleanScreen, ResultMediumScreen, ResultHighScreen,
   WhyExpandedScreen, ComponentsPage, BatchScreen, HistoryScreen,
   SignInScreen, SignUpScreen, CommandPalette */
// Top-level router. Each route = one screen.
// HashRouter so the static server doesn't need URL-rewriting config.

const { HashRouter, Switch, Route, Redirect } = ReactRouterDOM;

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
  { path: '/signin',         component: SignInScreen },
  { path: '/signup',         component: SignUpScreen },
];

function App() {
  return (
    <HashRouter>
      <CommandPalette />
      <Switch>
        {ROUTES.map((r) => (
          <Route key={r.path} path={r.path} component={r.component} />
        ))}
        <Route path="/" exact component={HomeScreen} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </HashRouter>
  );
}
