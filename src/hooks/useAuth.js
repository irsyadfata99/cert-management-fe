import useAuthStore from "../store/authStore";

// Convenience hook — shortcut ke authStore
const useAuth = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const logout = useAuthStore((s) => s.logout);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isTeacher = useAuthStore((s) => s.isTeacher);

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    isSuperAdmin: isSuperAdmin(),
    isAdmin: isAdmin(),
    isTeacher: isTeacher(),
  };
};

export default useAuth;
