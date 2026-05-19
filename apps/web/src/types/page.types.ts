// Auth page modes
export type AuthMode = "login" | "register"

// Page props types
export type AuthPageProps = {
  initialMode?: AuthMode
}

export type LoginPageProps = {
  onSwitchToRegister?: () => void
}

export type RegisterPageProps = {
  onSwitchToLogin?: () => void
}

// Form status
export type FormStatus = "idle" | "success" | "error"
