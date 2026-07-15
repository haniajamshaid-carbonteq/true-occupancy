/* global React, ReactRouterDOM, Button, Input, Checkbox, Icon */
// AuthScreen — paired Sign-In / Sign-Up flow.
//
// Auth model (per the Halcyon SSO walkthrough, 2026-07-15): enterprise
// single sign-on is the primary path. Three identity providers — Microsoft
// (Entra, the default the tenant auto-logs on against), Okta, and Google —
// lead each form; email + password is kept as a labeled fallback for pilots
// and service accounts that don't have an IdP. Provider buttons stay on the
// neutral surface with their own brand marks (DESIGN.md §13.1 reserves the
// teal budget for the app's single primary CTA, and each provider's brand
// guidelines require its own colored mark on a plain button).
//
// Desktop (lg+): floating two-pane card. The image panel is absolutely
// positioned over half the card and slides between sides as the user
// toggles between sign-in and sign-up — both forms are always rendered
// behind the slider. Behavior reference: Hyper-S "Welcome to" demo.
//
// Mobile: image collapses to a compact rounded hero strip at the top,
// form below. No slide animation — mode swap happens inline.
//
// Mode is derived from the URL (#/signin vs. #/signup) so the state is
// bookmarkable. Toggle CTAs call history.push().

interface AuthScreenProps {
  mode: 'signin' | 'signup';
}

const HERO_IMAGE_URL = 'uploads/pexels-introspectivedsgn-9150640.jpg';

// Subtle bottom scrim so white headline/CTA stay legible against the photo.
const HERO_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)';

// --- shared bits ---------------------------------------------------------

function HalcyonMark({ size = 28 }: { size?: number }) {
  return (
    <img
      src="docs/brand/halcyon-mark-v2.png"
      alt="Halcyon"
      width={size}
      height={size}
      style={{ width: size, height: size, display: 'block' }}
    />
  );
}

function FormHeading({
  title,
  sub,
  formMode,
}: {
  title: string;
  sub: string;
  formMode: 'signin' | 'signup';
}) {
  return (
    <div data-form-heading={formMode}>
      <h1
        className="font-sans font-semibold m-0 leading-tight tracking-[-0.012em]"
        style={{ fontSize: 'var(--text-h2)', color: 'var(--navy)' }}
      >
        {title}
      </h1>
      <p
        className="m-0 mt-2 text-body-sm leading-relaxed"
        style={{ color: 'var(--ink-3)' }}
      >
        {sub}
      </p>
    </div>
  );
}

// Image-panel content — used both desktop (full-height) and mobile (strip).
// Content is mode-agnostic so the desktop slide animation has no in-flight
// content swap (one transform on static content = perceived smoothness).
// The mode toggle lives at the bottom of each form.
function ImagePanelContent({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative h-full w-full flex flex-col text-white ${
        compact ? 'p-card' : 'p-12'
      }`}
      style={{
        background: `url(${HERO_IMAGE_URL}) center/cover no-repeat`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: HERO_SCRIM, zIndex: 1 }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className={compact ? 'mt-3' : 'mt-auto'}>
          {compact && (
            <div className="font-sans text-eyebrow uppercase tracking-[0.18em] font-semibold opacity-85 mb-1">
              Halcyon · TrueOccupancy™
            </div>
          )}
          <div
            className="font-sans font-semibold leading-[1.1] tracking-[-0.015em]"
            style={{
              fontSize: compact ? 22 : 38,
              textShadow: '0 1px 12px rgba(0,0,0,0.5)',
            }}
          >
            True occupancy, verified.
          </div>
          <p
            className="mt-2 text-label leading-relaxed opacity-90 max-w-[34ch]"
            style={{ textShadow: '0 1px 10px rgba(0,0,0,0.45)' }}
          >
            One address — every listing, every signal, scored in seconds.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- SSO shared bits -----------------------------------------------------

// Provider order is deliberate: Microsoft first — it's the default IdP the
// app attempts an auto-logon against — then Okta, then Google.
const SSO_PROVIDERS: { name: 'microsoft' | 'okta' | 'google'; label: string }[] = [
  { name: 'microsoft', label: 'Microsoft' },
  { name: 'okta', label: 'Okta' },
  { name: 'google', label: 'Google' },
];

// The three provider buttons. Neutral surface + the provider's own colored
// mark; "Continue with …" reads the same for sign-in and sign-up because SSO
// auto-provisions the account either way. onPick simulates a successful
// federated login in the prototype.
function SsoOptions({ onPick }: { onPick: () => void }) {
  return (
    <div className="flex flex-col gap-2.5">
      {SSO_PROVIDERS.map((p) => (
        <Button
          key={p.name}
          variant="default"
          type="button"
          onClick={onPick}
          className="w-full justify-center h-11"
          icon={<Icon name={p.name} size={18} />}
        >
          Continue with {p.label}
        </Button>
      ))}
    </div>
  );
}

// "or sign in with email" style rule between the SSO block and the fallback.
function OrDivider({ label }: { label: string }) {
  return (
    <div className="relative my-1 flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
      <span
        className="font-sans text-eyebrow uppercase tracking-[0.1em] font-medium whitespace-nowrap"
        style={{ color: 'var(--ink-4)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
    </div>
  );
}

// Trust line under the CTA — reassures enterprise users the session is
// brokered by their own identity provider, not stored here.
function SsoTrustNote() {
  return (
    <div
      className="flex items-center justify-center gap-1.5 text-caption"
      style={{ color: 'var(--ink-4)' }}
    >
      <Icon name="shield" size={13} />
      <span>Single sign-on secured by your identity provider.</span>
    </div>
  );
}

// --- Sign-In form --------------------------------------------------------

function SignInForm({
  onToggle,
  onSubmit,
}: {
  onToggle: () => void;
  onSubmit: () => void;
}) {
  const [email, setEmail] = React.useState('');
  const [pwd, setPwd] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [remember, setRemember] = React.useState(true);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-5 w-full max-w-[380px] mx-auto"
    >
      <FormHeading
        title="Sign In"
        sub="Use your organization's single sign-on, or your email below."
        formMode="signin"
      />

      <SsoOptions onPick={onSubmit} />

      <OrDivider label="Or sign in with email" />

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        leadingIcon={<Icon name="mail" />}
      />

      <Input
        label="Password"
        type={show ? 'text' : 'password'}
        autoComplete="current-password"
        placeholder="Enter your password"
        value={pwd}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPwd(e.target.value)}
        leadingIcon={<Icon name="lock" />}
        trailing={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="grid place-items-center w-6 h-6 bg-transparent border-0 cursor-pointer"
            style={{ color: 'var(--ink-3)' }}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            <Icon name={show ? 'eye-off' : 'eye'} size={16} />
          </button>
        }
      />

      <div className="flex items-center justify-between">
        <Checkbox
          label="Remember me"
          checked={remember}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemember(e.target.checked)}
        />
        <a
          href="#/signin"
          className="font-sans text-caption font-semibold no-underline"
          style={{ color: 'var(--brand-deep)' }}
        >
          Forgot password?
        </a>
      </div>

      <Button variant="primary" type="submit" className="w-full justify-center h-11">
        Sign In
      </Button>

      <SsoTrustNote />

      <div
        className="font-sans text-label text-center mt-2"
        style={{ color: 'var(--ink-3)' }}
      >
        New here?{' '}
        <button
          type="button"
          onClick={onToggle}
          className="font-semibold bg-transparent border-0 cursor-pointer p-0"
          style={{ color: 'var(--brand-deep)' }}
        >
          Create an Account
        </button>
      </div>
    </form>
  );
}

// --- Sign-Up form --------------------------------------------------------

function SignUpForm({
  onToggle,
  onSubmit,
}: {
  onToggle: () => void;
  onSubmit: () => void;
}) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [pwd, setPwd] = React.useState('');
  const [show, setShow] = React.useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-5 w-full max-w-[380px] mx-auto"
    >
      <FormHeading
        title="Create Account"
        sub="Continue with your organization's SSO, or sign up by email."
        formMode="signup"
      />

      <SsoOptions onPick={onSubmit} />

      <OrDivider label="Or sign up with email" />

      <Input
        label="Full name"
        type="text"
        autoComplete="name"
        placeholder="J. Marlow"
        value={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        leadingIcon={<Icon name="user" />}
      />

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        leadingIcon={<Icon name="mail" />}
      />

      <Input
        label="Password"
        type={show ? 'text' : 'password'}
        autoComplete="new-password"
        placeholder="Create a password"
        value={pwd}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPwd(e.target.value)}
        leadingIcon={<Icon name="lock" />}
        hint="At least 8 characters."
        trailing={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="grid place-items-center w-6 h-6 bg-transparent border-0 cursor-pointer"
            style={{ color: 'var(--ink-3)' }}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            <Icon name={show ? 'eye-off' : 'eye'} size={16} />
          </button>
        }
      />

      <Button variant="primary" type="submit" className="w-full justify-center h-11">
        Create Account
      </Button>

      <SsoTrustNote />

      <div
        className="font-sans text-label text-center mt-2"
        style={{ color: 'var(--ink-3)' }}
      >
        Already have an account?{' '}
        <button
          type="button"
          onClick={onToggle}
          className="font-semibold bg-transparent border-0 cursor-pointer p-0"
          style={{ color: 'var(--brand-deep)' }}
        >
          Sign In
        </button>
      </div>
    </form>
  );
}

// --- the screen ----------------------------------------------------------

function AuthScreen({ mode }: AuthScreenProps) {
  const history = ReactRouterDOM.useHistory();
  const isSignIn = mode === 'signin';

  function toggle() {
    history.push(isSignIn ? '/signup' : '/signin');
  }

  function landOnHome() {
    try { window.sessionStorage.setItem('to-signedIn', '1'); } catch {}
    history.push('/');
  }

  // Drive the slide imperatively with the Web Animations API. CSS
  // `transition` on a React-managed style object proved unreliable —
  // sometimes the style change and transition declaration get committed
  // in the same paint and no transition fires. WAAPI explicitly animates
  // from current → target on every mode change, regardless of React's
  // commit timing. Skips the first paint (no animation on initial mount).
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const logoRef = React.useRef<HTMLDivElement | null>(null);
  const prevModeRef = React.useRef<'signin' | 'signup' | null>(null);
  // useLayoutEffect — snaps positions *before* the browser paints, so the
  // first frame on /signin doesn't briefly show the logo on the wrong side.
  React.useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const panelTarget = isSignIn ? '0%' : '100%';

    // Logo sits in the corner OPPOSITE the image panel: on /signin the
    // image is left so the logo is right, and vice versa. Translated in
    // pixels so it lands at the far edge of its rail regardless of width.
    const logoEl = logoRef.current;
    const rail = logoEl?.parentElement;
    const logoFarX = rail && logoEl ? rail.offsetWidth - logoEl.offsetWidth : 0;
    const logoTargetX = isSignIn ? logoFarX : 0;

    // First mount: snap to target, no animation.
    if (prevModeRef.current === null) {
      el.style.transform = `translateX(${panelTarget})`;
      if (logoEl) logoEl.style.transform = `translateX(${logoTargetX}px)`;
      prevModeRef.current = mode;
      return;
    }
    if (prevModeRef.current === mode) return;

    const panelFrom = isSignIn ? '100%' : '0%';
    const timing: KeyframeAnimationOptions = {
      duration: 900,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    };

    el.animate(
      [
        { transform: `translateX(${panelFrom})` },
        { transform: `translateX(${panelTarget})` },
      ],
      timing
    );
    el.style.transform = `translateX(${panelTarget})`;

    // Logo snaps to the opposite corner — no animation, intentionally abrupt.
    if (logoEl) {
      logoEl.style.transform = `translateX(${logoTargetX}px)`;
    }

    // Pull attention to the heading of the form being revealed. Fires AFTER
    // the panel finishes sliding (delay ~= panel duration) so the heading
    // springs in as the user's eye lands on the now-uncovered form — not
    // while the panel is still covering it. Direction-aware: the heading
    // slides in from the same side the panel travelled toward.
    const revealedHeading = document.querySelector<HTMLElement>(
      `[data-form-heading="${mode}"]`
    );
    if (revealedHeading) {
      const h1 = revealedHeading.querySelector('h1');
      const sub = revealedHeading.querySelector('p');
      // On /signup the form is on the LEFT (panel went right) → heading
      // slides in from the LEFT. On /signin the form is on the RIGHT →
      // heading slides in from the RIGHT.
      const xFrom = isSignIn ? 36 : -36;
      if (h1) {
        h1.animate(
          [
            {
              opacity: 0,
              transform: `translate(${xFrom}px, 8px) scale(0.94)`,
              filter: 'blur(6px)',
            },
            {
              opacity: 1,
              transform: 'translate(0, 0) scale(1)',
              filter: 'blur(0)',
            },
          ],
          {
            duration: 700,
            delay: 650,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both',
          }
        );
      }
      if (sub) {
        sub.animate(
          [
            { opacity: 0, transform: `translate(${xFrom * 0.5}px, 6px)` },
            { opacity: 1, transform: 'translate(0, 0)' },
          ],
          {
            duration: 600,
            delay: 820,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both',
          }
        );
      }
    }

    prevModeRef.current = mode;
  }, [mode, isSignIn]);

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: '#ffffff' }}
    >
      {/* Mobile: stacked layout (image strip on top, form below) */}
      <div className="lg:hidden w-full max-w-[440px] mx-auto flex flex-col gap-5 p-4 sm:p-6">
        <div
          className="rounded-xl overflow-hidden shadow-md"
          style={{ height: 200 }}
        >
          <ImagePanelContent compact />
        </div>
        <div
          className="rounded-xl shadow-md p-card sm:p-8"
          style={{ background: 'var(--surface)' }}
        >
          {isSignIn ? (
            <SignInForm onToggle={toggle} onSubmit={landOnHome} />
          ) : (
            <SignUpForm onToggle={toggle} onSubmit={landOnHome} />
          )}
        </div>
      </div>

      {/* Desktop: full-viewport two-pane layout with sliding image panel.
          Image is inset slightly with rounded corners (Yetti.AI reference);
          forms sit directly on the page bg (no card frame around them). */}
      <div
        className="hidden lg:block relative w-full"
        style={{ height: '100vh', padding: 24 }}
      >
        {/* Single brand mark — lives in the corner opposite the image panel
            and slides with it on mode change. The wrapper occupies the
            screen's left rail (top:36, left:40, width = viewport - margins)
            with the logo nested inside; we then translate the logo from
            left edge (0%) to right edge (100%) of that rail, perfectly
            mirroring the panel's slide. */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: 36,
            left: 40,
            right: 40,
            height: 32,
            zIndex: 20,
          }}
        >
          <div
            ref={logoRef}
            style={{
              width: 32,
              height: 32,
              // useLayoutEffect snaps this to the correct pixel offset before
              // the first paint.
              transform: 'translateX(0)',
              willChange: 'transform',
            }}
          >
            <HalcyonMark size={32} />
          </div>
        </div>

        <div className="relative w-full h-full">
          {/* Two forms always rendered, side by side, each filling 50% of the viewport */}
          <div
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: '1fr 1fr' }}
          >
            {/* Left half — Sign-Up form (visible when image panel slides right) */}
            <div className="flex items-center justify-center px-12 py-10 overflow-y-auto">
              <SignUpForm onToggle={toggle} onSubmit={landOnHome} />
            </div>
            {/* Right half — Sign-In form (visible when image panel slides left) */}
            <div className="flex items-center justify-center px-12 py-10 overflow-y-auto">
              <SignInForm onToggle={toggle} onSubmit={landOnHome} />
            </div>
          </div>

          {/* Image panel — single static panel that slides across the viewport.
              No inner content swap during travel, so the motion reads as one
              continuous transform. Toggle is triggered by the link at the
              bottom of each form. */}
          <div
            ref={panelRef}
            className="absolute top-0 bottom-0 overflow-hidden rounded-xl"
            style={{
              left: 0,
              width: '50%',
              zIndex: 10,
              padding: 0,
              willChange: 'transform',
              boxShadow: 'var(--shadow-lg)',
              transform: `translateX(${isSignIn ? '0%' : '100%'})`,
            }}
          >
            <ImagePanelContent />
          </div>
        </div>
      </div>
    </div>
  );
}

// Single routed entry for both /signin and /signup — derives the mode from
// the URL so React Router keeps ONE AuthScreen instance across the toggle.
// (Two separate Route components would remount the screen on every flip,
// killing the CSS slide transition.) The name SignInScreen is preserved
// since App.tsx imports it from the global scope.
function SignInScreen() {
  const location = ReactRouterDOM.useLocation();
  const mode: 'signin' | 'signup' =
    location.pathname === '/signup' ? 'signup' : 'signin';
  return <AuthScreen mode={mode} />;
}

// Unused after consolidation — kept as a no-op alias so older entry points
// (e.g. design-spec previews) still resolve the global.
function SignUpScreen() {
  return <AuthScreen mode="signup" />;
}
