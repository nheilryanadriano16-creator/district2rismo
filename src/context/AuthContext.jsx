import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNotification } from "./NotificationContext";
import { normalizeRole } from "../utils/roles";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const signup = async (email, password, extraData = {}) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;

    const userRoleValue = normalizeRole(extraData.role);

    const { role: _signupRole, ...profileData } = extraData
    const userPayload = {
      uid: user.uid,
      email: user.email,
      createdAt: new Date(),
      ...profileData,
      role: userRoleValue,
    };

    await setDoc(doc(db, "users", user.uid), userPayload);

    setCurrentUser(user);
    setUserData(userPayload);
    setUserRole(userRoleValue);
    showNotification('Account created and logged in successfully!', 'success');
    return { user, role: userRoleValue };
  };

  const applyUserDocument = async (user) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      const role = normalizeRole(data.role);

      if (String(data.status || "").toLowerCase() === "deactivated") {
        await signOut(auth);
        setCurrentUser(null);
        setUserData(null);
        setUserRole(null);
        const error = new Error("This account has been deactivated.");
        error.code = "auth/account-deactivated";
        throw error;
      }

      setUserData(data);
      setUserRole(role);
      return { data, role };
    }

    const defaultData = {
      uid: user.uid,
      email: user.email,
      role: "customer",
      createdAt: new Date(),
    };
    await setDoc(userDocRef, defaultData);
    setUserData(defaultData);
    setUserRole("customer");
    return { data: defaultData, role: "customer" };
  };

  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const user = res.user;
    setCurrentUser(user);

    const { role } = await applyUserDocument(user);

    showNotification('Logged in successfully!', 'success');
    return { user, role };
  };

  const updateUserData = (partial) => {
    setUserData((current) => (current ? { ...current, ...partial } : current));
  };

  const enableHostAccount = async () => {
    if (!currentUser) {
      throw new Error("You must be signed in to create a host account.");
    }

    if (userRole === "host") return;
    if (userRole !== "customer") {
      throw new Error("Only customer accounts can apply for host access.");
    }

    const hostAccountData = {
      role: "host",
      status: "Unverified",
      hostAccountCreatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, "users", currentUser.uid), hostAccountData);
    setUserData((current) => (
      current
        ? { ...current, ...hostAccountData, hostAccountCreatedAt: new Date() }
        : current
    ));
    setUserRole("host");
    showNotification("Host access created. Complete verification to list your property.", "success");
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      setUserData(null);
      setCurrentUser(null);
      showNotification('Logged out successfully.', 'success');
    } catch (err) {
      console.error('Logout error:', err);
      showNotification('Failed to log out.', 'danger');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          await applyUserDocument(user);
        } catch (err) {
          if (err.code !== "auth/account-deactivated") {
            console.error("Failed to load user profile:", err);
          }
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, userRole, signup, login, logout, updateUserData, enableHostAccount, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);