import { Navigate } from "react-router-dom";
import { hasRole } from "../utils/auth";

function RoleRoute({ roles, children }) {
    if (!hasRole(...roles)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default RoleRoute;
