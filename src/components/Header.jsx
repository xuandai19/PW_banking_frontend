import { useNavigate } from "react-router-dom";
import { logout } from "../services/authApi";
import { clearAuth, getCurrentUser } from "../utils/auth";

function Header() {
    const navigate = useNavigate();
    const user = getCurrentUser();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.warn("Logout request failed:", error);
        } finally {
            clearAuth();
            navigate("/login", { replace: true });
        }
    };

    return (
        <header className="header">
            <h1>Banking Management System</h1>

            <div className="header-user">
                <span>{user?.fullName || user?.username}</span>
                <span className="role-badge">{user?.role}</span>
                <button onClick={handleLogout}>Logout</button>
            </div>
        </header>
    );
}

export default Header;
