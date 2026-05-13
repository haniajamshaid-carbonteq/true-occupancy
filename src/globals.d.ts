// Ambient declarations for the no-bundler runtime.
//
// All component .tsx files share global scope (loaded by the bootstrap in
// app.html / components.html). Real types for React would require
// `npm install @types/react` — until then we stub the cross-file globals
// loosely as `any`, which keeps the IDE quiet without hiding real bugs in
// the local function/prop shapes that ARE typed.
//
// Naming convention:
//   - `declare function X(props?: any): any;` for things defined as
//     `function X() {}` in their source file. Function declarations merge.
//   - `declare var X: any;` for plain runtime objects (data, libraries).

// === Globals from <script> tags ===
// NB: do NOT add `declare var React: any` here. TypeScript can't merge a var
// declaration with a namespace, and the var would shadow the type side, breaking
// `React.HTMLAttributes` etc. The `declare namespace React` block below provides
// both the value side (React.useState, React.createElement) and the type side.
declare var ReactDOM: any;
declare var ReactRouterDOM: any;
declare var Babel: any;

// React namespace stubs — provide both value (hooks, Fragment, createElement) and
// type (ReactNode, HTMLAttributes, etc.) access. All resolve to `any`.
declare namespace React {
  type ReactNode = any;
  type ReactElement = any;
  type Ref<T = any> = any;
  type Key = any;
  type CSSProperties = any;
  type FC<P = any> = (props: P) => any;
  type FunctionComponent<P = any> = FC<P>;
  type ComponentType<P = any> = any;
  type HTMLAttributes<T = any> = any;
  type ButtonHTMLAttributes<T = any> = any;
  type InputHTMLAttributes<T = any> = any;
  type AnchorHTMLAttributes<T = any> = any;
  type ImgHTMLAttributes<T = any> = any;
  type SVGAttributes<T = any> = any;
  type DetailedHTMLProps<P = any, T = any> = any;
  type Dispatch<A = any> = (action: A) => void;
  type SetStateAction<S = any> = S | ((prev: S) => S);
  const Fragment: any;
  function useState<S = any>(initial?: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  function useMemo<T = any>(factory: () => T, deps: any[]): T;
  function useCallback<T = any>(fn: T, deps: any[]): T;
  function useRef<T = any>(initial?: T): { current: T };
  function createElement(...args: any[]): any;
}

// JSX namespace — accepts any tag, any attribute.
// IntrinsicAttributes adds `key` to every JSX element (mirrors React's
// LibraryManagedAttributes behavior); IntrinsicClassAttributes adds `ref`.
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface Element {}
  interface ElementClass {}
  interface ElementAttributesProperty {
    props: {};
  }
  interface ElementChildrenAttribute {
    children: {};
  }
  interface IntrinsicAttributes {
    key?: any;
  }
  interface IntrinsicClassAttributes<T> {
    ref?: any;
  }
}

// === Domain (src/data/scenarios.tsx) ===
declare var PROPERTY: any;
declare var PLATFORMS: any[];
declare var SCENARIOS: any;
declare function buildScanSteps(scenario: string, frame: string): any[];

// === Primitives (src/components/ui/*.tsx) ===
declare function Button(props?: any): any;
declare function Pill(props?: any): any;
declare function Card(props?: any): any;
declare function RiskBadge(props?: any): any;
declare function SearchBar(props?: any): any;
declare function CommandSearch(props?: any): any;
declare function CommandPalette(props?: any): any;
declare function openCommandPalette(): void;
declare function Avatar(props?: any): any;
declare function Keycap(props?: any): any;
declare function DataTable(props?: any): any;
declare function MetricCard(props?: any): any;
declare function DropdownMenu(props?: any): any;
declare function Icon(props?: any): any;

// === Compositions ===
declare function AppShell(props?: any): any;
declare function Sidebar(props?: any): any;
declare function PageHeader(props?: any): any;
declare function ScanContextBar(props?: any): any;
declare function AutomateModal(props?: any): any;
declare function AutomationControl(props?: any): any;
declare function VerdictTiles(props?: any): any;
declare function useAppState(): any;
declare function ScanCard(props?: any): any;
declare function ScoreCard(props?: any): any;
declare function WhyCard(props?: any): any;

// Cross-file type aliases (declared in scenarios.tsx, shared via the
// script-context type scope).
type ScenarioKey = 'low' | 'medium' | 'high';
declare function PropertyOverview(props?: any): any;
declare function PropertyMap(props?: any): any;
declare function PropertySpecs(props?: any): any;
declare function ListingsPanel(props?: any): any;

// === Pages ===
declare function ComponentsPage(props?: any): any;
declare function HomeScreen(props?: any): any;
declare function HistoryScreen(props?: any): any;
declare function BatchScreen(props?: any): any;
declare function ScanStartScreen(props?: any): any;
declare function ScanMidScreen(props?: any): any;
declare function ResultCleanScreen(props?: any): any;
declare function ResultMediumScreen(props?: any): any;
declare function ResultHighScreen(props?: any): any;
declare function WhyExpandedScreen(props?: any): any;
declare function ProfileScreen(props?: any): any;
declare function App(props?: any): any;
