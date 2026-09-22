import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, getCurrentUser } from "../utils/auth";

function ProtectedRoute({ children }) {
    const location = useLocation();
    const user = getCurrentUser();

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Khách hàng không vào khu vực quản trị
    if (user?.role === "CUSTOMER") {
        return <Navigate to="/customer" replace />;
    }

    return children;
}

export default ProtectedRoute;