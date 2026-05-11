/* global React, ReactRouterDOM, Button, Input, Checkbox, Icon */
// AuthScreen — paired Sign-In / Sign-Up flow.
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

const HERO_OVERLAY =
  'linear-gradient(135deg, rgba(10,183,163,.55), rgba(1,94,122,.78))';

// --- shared bits ---------------------------------------------------------

function HalcyonMark({ size = 28 }: { size?: number }) {
  return (
    <img
      src="halcyon-mark-v2.png"
      alt="Halcyon"
      width={size}
      height={size}
      style={{ width: size, height: size, display: 'block' }}
    />
  );
}

function FormHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <div className="mb-5">
        <HalcyonMark size={28} />
      </div>
      <h1
        className="font-sans font-semibold m-0 leading-tight tracking-[-0.012em]"
        style={{ fontSize: "var(--text-h2)", color: 'var(--navy)' }}
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
function ImagePanelContent({
  oppositeMode,
  onToggle,
  compact = false,
}: {
  oppositeMode: 'signin' | 'signup';
  onToggle: () => void;
  compact?: boolean;
}) {
  const eyebrow = compact ? 'Halcyon · TrueOccupancy™' : null;
  const heading = compact
    ? oppositeMode === 'signup'
      ? 'New here?'
      : 'Welcome back.'
    : 'Verify with confidence.';
  const sub =
    oppositeMode === 'signup'
      ? 'Create an account to start scanning properties.'
      : 'Sign in to continue your scan history.';
  const ctaLabel = oppositeMode === 'signup' ? 'Sign up' : 'Sign in';
  const ctaHint =
    oppositeMode === 'signup'
      ? "Don't have an account?"
      : 'Already have an account?';

  return (
    <div
      className={`relative h-full w-full flex flex-col text-white ${
        compact ? 'p-6' : 'p-12'
      }`}
      style={{
        background: `${HERO_OVERLAY}, url(${HERO_IMAGE_URL}) center/cover no-repeat`,
        // grayscale safety net — applied only to the image layer via
        // a sibling pseudo-element wouldn't work here, so apply a desaturating
        // mix-blend overlay below to be safe even if the asset is colour.
      }}
    >
      {/* Grayscale safety net — sits under the teal overlay so the photo
          reads desaturated even if it's a colour source */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `url(${HERO_IMAGE_URL}) center/cover no-repeat`,
          filter: 'grayscale(1) contrast(1.05)',
          zIndex: 0,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: HERO_OVERLAY, zIndex: 1 }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col h-full">
        {!compact && (
          <div className="font-sans text-micro uppercase tracking-[0.18em] font-semibold opacity-90">
            Halcyon · TrueOccupancy<sup className="text-[0.6em] align-top">™</sup>
          </div>
        )}

        <div className={compact ? 'mt-3' : 'mt-auto'}>
          {eyebrow && (
            <div className="font-sans text-eyebrow uppercase tracking-[0.18em] font-semibold opacity-85 mb-1">
              {eyebrow}
            </div>
          )}
          <div
            className="font-sans font-semibold leading-[1.1] tracking-[-0.015em]"
            style={{ fontSize: compact ? 22 : 38 }}
          >
            {heading}
          </div>
          <p
            className="mt-2 text-label leading-relaxed opacity-90 max-w-[34ch]"
          >
            {sub}
          </p>

          <button
            type="button"
            onClick={onToggle}
            className="mt-6 inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-label font-semibold cursor-pointer transition-colors"
            style={{
              border: '1.5px solid rgba(255,255,255,0.85)',
              color: 'white',
              background: 'transparent',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                'rgba(255,255,255,0.12)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                'transparent')
            }
          >
            <span style={{ opacity: 0.85, fontWeight: 500 }}>{ctaHint}</span>
            <span>{ctaLabel}</span>
          </button>
        </div>
      </div>
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
        title="Sign in"
        sub="Continue your scan history and verifications."
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

      <div className="relative my-1 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
        <span
          className="font-sans text-eyebrow uppercase tracking-[0.18em] font-medium"
          style={{ color: 'var(--ink-4)' }}
        >
          Or
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
      </div>

      <Button
        variant="default"
        type="button"
        className="w-full justify-center h-11"
        icon={<Icon name="google" size={16} />}
      >
        Sign in with Google
      </Button>

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
          Create an account
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
        title="Create account"
        sub="Start verifying property occupancy in minutes."
      />

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

      <div className="relative my-1 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
        <span
          className="font-sans text-eyebrow uppercase tracking-[0.18em] font-medium"
          style={{ color: 'var(--ink-4)' }}
        >
          Or
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
      </div>

      <Button
        variant="default"
        type="button"
        className="w-full justify-center h-11"
        icon={<Icon name="google" size={16} />}
      >
        Sign up with Google
      </Button>

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
          Sign in
        </button>
      </div>
    </form>
  );
}

// --- the screen ----------------------------------------------------------

function AuthScreen({ mode }: AuthScreenProps) {
  const history = ReactRouterDOM.useHistory();
  const isSignIn = mode === 'signin';
  const oppositeMode = isSignIn ? 'signup' : 'signin';

  function toggle() {
    history.push(isSignIn ? '/signup' : '/signin');
  }

  function landOnHome() {
    history.push('/');
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: 'var(--bg)' }}
    >
      {/* Mobile: stacked layout (image strip on top, form below) */}
      <div className="lg:hidden w-full max-w-[440px] mx-auto flex flex-col gap-5 p-4 sm:p-6">
        <div
          className="rounded-xl overflow-hidden shadow-md"
          style={{ height: 200 }}
        >
          <ImagePanelContent
            oppositeMode={oppositeMode}
            onToggle={toggle}
            compact
          />
        </div>
        <div
          className="rounded-xl shadow-md p-6 sm:p-8"
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

          {/* Image panel — absolutely positioned, 50% wide, slides via translateX.
              Uses cubic-bezier(0.65, 0, 0.35, 1) — a smoother in/out curve so the
              motion reads as "the panel travelled across" rather than "the panel
              jumped". Duration bumped to 750ms so the eye can track it. */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: 0,
              width: '50%',
              transform: isSignIn ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 750ms cubic-bezier(0.65, 0, 0.35, 1)',
              zIndex: 10,
              padding: 0,
              willChange: 'transform',
            }}
          >
            <div
              className="relative w-full h-full rounded-xl overflow-hidden"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            >
              <ImagePanelContent
                oppositeMode={oppositeMode}
                onToggle={toggle}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignInScreen() {
  return <AuthScreen mode="signin" />;
}

function SignUpScreen() {
  return <AuthScreen mode="signup" />;
}
