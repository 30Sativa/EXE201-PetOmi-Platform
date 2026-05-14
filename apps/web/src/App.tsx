import { useEffect, useState } from "react"

import AuthPage from "./pages/AuthPage"
import LandingPage from "./pages/LandingPage"

const getRoute = () => window.location.hash.replace("#", "") || "/"

function App() {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const handleRouteChange = () => setRoute(getRoute())

    window.addEventListener("hashchange", handleRouteChange)
    return () => window.removeEventListener("hashchange", handleRouteChange)
  }, [])

  if (route === "/login") {
    return <AuthPage initialMode="login" />
  }

  if (route === "/register") {
    return <AuthPage initialMode="register" />
  }

  return <LandingPage />
}

export default App
