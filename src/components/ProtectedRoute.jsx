import { Navigate, useLocation } from "react-router-dom";
<<<<<<< HEAD
import { isAuthenticated } from "../utils/auth";

function ProtectedRoute({ children }) {
    const location = useLocation();
=======
import { isAuthenticated, getCurrentUser } from "../utils/auth";

function ProtectedRoute({ children }) {
    const location = useLocation();
    const user = getCurrentUser();
>>>>>>> feature/v2_users

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

<<<<<<< HEAD
=======
    // Khách hàng không vào khu vực quản trị
    if (user?.role === "CUSTOMER") {
        return <Navigate to="/customer" replace />;
    }

>>>>>>> feature/v2_users
    return children;
}

export default ProtectedRoute;
