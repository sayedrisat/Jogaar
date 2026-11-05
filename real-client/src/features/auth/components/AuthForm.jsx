import { useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ArrowRight, BriefcaseBusiness, Eye, EyeOff, UserRound } from "lucide-react";

// This only controls when the next fields are shown. The server still owns auth validation.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function PasswordField({ id, label, name, register, rules, error, autoComplete, revealed, onToggle, disabled }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-wrap">
        <input
          autoComplete={autoComplete}
          disabled={disabled}
          id={id}
          aria-invalid={Boolean(error)}
          type={revealed ? "text" : "password"}
          {...register(name, rules)}
        />
        <button
          aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={revealed}
          className="auth-visibility-button"
          disabled={disabled}
          onClick={onToggle}
          type="button"
        >
          {revealed ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
        </button>
      </div>
      {error && <p className="auth-email-hint" role="alert">{error.message}</p>}
    </div>
  );
}

// UI fields hand the same values to real-client's existing login/register handlers.
function AuthForm({ mode, onSubmit, onGoogleSignIn, onSwitchMode, titleId, authError }) {
  const isSignUp = mode === "sign-up";
  const uid = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, control, getValues, formState: { errors, isSubmitting } } = useForm({
    mode: "onChange",
    defaultValues: isSignUp
      ? { name: "", email: "", role: "seeker", password: "", confirmPassword: "" }
      : { email: "", password: "" },
  });
  const email = useWatch({ control, name: "email" }) ?? "";
  const isEmailValid = EMAIL_PATTERN.test(email.trim());

  // These values go to Login.jsx or Join.jsx, where the user's Redux thunk runs.
  const submitForm = handleSubmit((values) => onSubmit(values));

  return (
    <div className="auth-form-content" key={mode}>
      <p className="auth-eyebrow">{isSignUp ? "Get started" : "Welcome back"}</p>
      <h2 id={titleId}>{isSignUp ? "Create your account" : "Sign in to Jogaar"}</h2>
      <p className="auth-subtitle">
        {isSignUp
          ? "Make a place for your next project or your next client."
          : "Your work, conversations, and saved services are here."}
      </p>

      <button
        className="auth-google-button"
        disabled={!onGoogleSignIn}
        onClick={onGoogleSignIn}
        type="button"
      >
        <span aria-hidden="true" className="auth-google-mark">G</span>
        <span>Continue with Google</span>
        {!onGoogleSignIn && <span className="auth-soon">Soon</span>}
      </button>

      <div className="auth-divider"><span>or continue with email</span></div>

      <form className="auth-form" noValidate onSubmit={submitForm}>
        <div className="auth-field">
          <label htmlFor={`${uid}-email`}>Email address</label>
          <input
            aria-describedby={errors.email ? `${uid}-email-hint` : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            id={`${uid}-email`}
            inputMode="email"
            placeholder="you@example.com"
            type="email"
            {...register("email", {
              required: "Enter your email to continue.",
              validate: (value) => EMAIL_PATTERN.test(value.trim()) || "Enter a valid email to continue.",
            })}
          />
          {errors.email && (
            <p className="auth-email-hint" id={`${uid}-email-hint`}>{errors.email.message}</p>
          )}
        </div>

        <div
          aria-hidden={!isEmailValid}
          className={`auth-email-dependent${isEmailValid ? " is-visible" : ""}`}
          inert={!isEmailValid}
        >
          <div className="auth-email-dependent-inner">
            {isSignUp && (
              <div className="auth-field">
                <label htmlFor={`${uid}-name`}>Full name</label>
                <input autoComplete="name" disabled={!isEmailValid} id={`${uid}-name`} placeholder="Your name" type="text" {...register("name", { required: "Name is required." })} />
                {errors.name && <p className="auth-email-hint" role="alert">{errors.name.message}</p>}
              </div>
            )}

            {isSignUp && (
              <fieldset className="auth-role-fieldset" disabled={!isEmailValid}>
                <legend>I want to join as a</legend>
                <div className="auth-role-options">
                  <label className="auth-role-option">
                    <input type="radio" value="seeker" {...register("role", { required: "Choose a role." })} />
                    <UserRound aria-hidden="true" size={19} />
                    <span><strong>Seeker</strong><small>Find services</small></span>
                  </label>
                  <label className="auth-role-option">
                    <input type="radio" value="provider" {...register("role", { required: "Choose a role." })} />
                    <BriefcaseBusiness aria-hidden="true" size={19} />
                    <span><strong>Provider</strong><small>Offer services</small></span>
                  </label>
                </div>
                {errors.role && <p className="auth-email-hint" role="alert">{errors.role.message}</p>}
              </fieldset>
            )}

            <PasswordField
              autoComplete={isSignUp ? "new-password" : "current-password"}
              disabled={!isEmailValid}
              id={`${uid}-password`}
              label="Password"
              name="password"
              register={register}
              rules={{ required: "Password is required." }}
              error={errors.password}
              onToggle={() => setShowPassword((value) => !value)}
              revealed={showPassword}
            />

            {isSignUp && (
              <>
                <PasswordField
                  autoComplete="new-password"
                  disabled={!isEmailValid}
                  id={`${uid}-confirm-password`}
                  label="Confirm password"
                  name="confirmPassword"
                  register={register}
                  rules={{
                    required: "Confirm your password.",
                    validate: (value) => value === getValues("password") || "Passwords do not match.",
                  }}
                  error={errors.confirmPassword}
                  onToggle={() => setShowConfirmPassword((value) => !value)}
                  revealed={showConfirmPassword}
                />
                <p className="auth-password-hint">
                  Use at least 8 characters (up to 72 UTF-8 bytes), with uppercase, lowercase, a number, and a special character.
                </p>
              </>
            )}
          </div>
        </div>

        {authError && authError !== "Refresh Token required" && <p className="auth-server-error" role="alert">{authError}</p>}
        <button className="auth-submit" disabled={isSubmitting} type="submit">
          <span>{isSubmitting ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}</span>
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </form>

      <p className="auth-switch">
        {isSignUp ? "Already have an account?" : "New to Jogaar?"}{" "}
        <button onClick={() => onSwitchMode(isSignUp ? "sign-in" : "sign-up")} type="button">
          {isSignUp ? "Sign in" : "Create an account"}
        </button>
      </p>
    </div>
  );
}

export default AuthForm;
