export default function Header() {
    const logout = () => {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    };
  
    return (
      <header className="h-14 bg-white shadow flex items-center justify-between px-6">
        <span className="font-semibold text-gray-700">
          Admin Dashboard
        </span>
  
        <button
          onClick={logout}
          className="text-sm text-red-500 hover:underline"
        >
          Logout
        </button>
      </header>
    );
  }
  