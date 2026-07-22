import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login-page";
import MainPage from "./pages/main-page";
import DiagnosticExportPage from "./components/client-info-page-components/diagnostic-export-download-component";
import { AuthProvider, useAuth } from "./context/auth-context";
import './i18nConfig';

type UserProfile = {
  username: string;
  phoneNumber: string;
  email: string;
  birthDate: string;
  selectedOption: string;
  userId?: number | null;
};

function AppContent() {
  const { user, login, isAuthenticated } = useAuth();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const profileLoadAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.userId || profileLoaded) {
      return;
    }
    if (profileLoadAttemptedRef.current) {
      return;
    }
    profileLoadAttemptedRef.current = true;

    const userId = user.userId;
    const cachedProfile = sessionStorage.getItem(`userProfile:${userId}`);
    if (cachedProfile) {
      try {
        const parsedProfile = JSON.parse(cachedProfile) as UserProfile;
        login(parsedProfile);
        setProfileLoaded(true);
        return;
      } catch {
        sessionStorage.removeItem(`userProfile:${userId}`);
      }
    }

    //fetch(`http://localhost:8080/api/users/${userId}`)
    fetch(`/api/users/${userId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load user profile");
        }
        const data = (await response.json()) as UserProfile;
        const nextProfile: UserProfile = {
          username: data.username || user.username,
          phoneNumber: data.phoneNumber || "",
          email: data.email || user.email,
          birthDate: data.birthDate || "",
          selectedOption: data.selectedOption || "opcao-pt",
          userId,
        };
        login(nextProfile);
        sessionStorage.setItem(`userProfile:${userId}`, JSON.stringify(nextProfile));
        setProfileLoaded(true);
      })
      .catch(() => {
        setProfileLoaded(true);
      });
  }, [isAuthenticated, user, profileLoaded, login]);

  useEffect(() => {
    if (!isAuthenticated) {
      profileLoadAttemptedRef.current = false;
      setProfileLoaded(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <LoginPage
        onLogin={(profile) => {
          console.log("Saved userId:", profile.userId);
          login(profile);
        }}
        onAccountCreated={(profile) => {
          sessionStorage.setItem("pendingProfile", JSON.stringify(profile));
        }}
      />
    );
  }

  return (
    <MainPage
      username={user.username}
      phonenumber={user.phoneNumber}
      email={user.email}
      birthDate={user.birthDate}
      selectedOption={user.selectedOption}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route: opened directly in an external browser (not the
            App Inventor WebViewer) via ActivityStarter. No login required,
            since the export endpoints are open. */}
        <Route path="/export/:id" element={<DiagnosticExportPage />} />

        {/* Everything else keeps the existing login/main-page flow, now
            wrapped in AuthProvider only for this branch. */}
        <Route
          path="*"
          element={
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}