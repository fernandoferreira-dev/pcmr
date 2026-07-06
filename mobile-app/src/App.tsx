import { useEffect, useRef, useState } from "react";
import LoginPage from "./pages/login-page";
import MainPage from "./pages/main-page";

type UserProfile = {
  username: string;
  phoneNumber: string;
  email: string;
  birthDate: string;
  selectedOption: string;
  userId?: number | null;
};

function App() {
  const [page, setPage] = useState<"login" | "dashboard">("login");
  const [selectedOption, setSelectedOption] = useState("opcao-pt");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const profileLoadAttemptedRef = useRef(false);

  const applyProfile = (profile: UserProfile) => {
    setUsername(profile.username);
    setPhoneNumber(profile.phoneNumber);
    setEmail(profile.email);
    setBirthDate(profile.birthDate);
    setSelectedOption(profile.selectedOption);
    setUserId(profile.userId ?? null);
  };

  useEffect(() => {
    if (page !== "dashboard" || !userId || profileLoaded) {
      return;
    }

    if (profileLoadAttemptedRef.current) {
      return;
    }

    profileLoadAttemptedRef.current = true;

    const cachedProfile = sessionStorage.getItem(`userProfile:${userId}`);
    if (cachedProfile) {
      try {
        const parsedProfile = JSON.parse(cachedProfile) as UserProfile;
        applyProfile(parsedProfile);
        setProfileLoaded(true);
        return;
      } catch {
        sessionStorage.removeItem(`userProfile:${userId}`);
      }
    }

    fetch(`http://localhost:8080/api/users/${userId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load user profile");
        }

        const data = (await response.json()) as UserProfile;
        const nextProfile = {
          username: data.username || username,
          phoneNumber: data.phoneNumber || "",
          email: data.email || email,
          birthDate: data.birthDate || "",
          selectedOption: data.selectedOption || "opcao-pt",
          userId,
        };

        applyProfile(nextProfile);
        sessionStorage.setItem(`userProfile:${userId}`, JSON.stringify(nextProfile));
        setProfileLoaded(true);
      })
      .catch(() => {
        setProfileLoaded(true);
      });
  }, [page, userId, profileLoaded, username, email]);

  useEffect(() => {
    if (page === "login") {
      profileLoadAttemptedRef.current = false;
      setProfileLoaded(false);
    }
  }, [page]);

  return page === "login" ? (
    <LoginPage
      onLogin={(profile) => {
        applyProfile(profile);
        setPage("dashboard");
      }}
      onAccountCreated={(profile) => {
        applyProfile(profile);
      }}
    />
  ) : (
    <MainPage
      username={username}
      phonenumber={phoneNumber}
      email={email}
      birthDate={birthDate}
      selectedOption={selectedOption}
    />
  );
}

export default App;