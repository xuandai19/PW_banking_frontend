import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Bank from "./pages/Bank";
import Branch from "./pages/Branch";
import Account from "./pages/Account";
import Transaction from "./pages/Transaction";
import Approval from "./pages/Approval";
import Users from "./pages/Users";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import { ROLES } from "./utils/auth";

function App() {
    return (
        <Routes>
            {/* Auth công khai */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Dashboard />} />
                <Route
                    path="banks"
                    element={
                        <RoleRoute roles={[ROLES.ADMIN]}>
                            <Bank />
                        </RoleRoute>
                    }
                />
                <Route
                    path="branches"
                    element={
                        <RoleRoute roles={[ROLES.ADMIN, ROLES.SUBADMIN, ROLES.BANK, ROLES.BRANCH]}>
                            <Branch />
                        </RoleRoute>
                    }
                />
                <Route path="accounts" element={<Account />} />
                <Route path="transactions" element={<Transaction />} />
                <Route
                    path="approvals"
                    element={
                        <RoleRoute roles={[ROLES.ADMIN]}>
                            <Approval />
                        </RoleRoute>
                    }
                />
                <Route
                    path="users"
                    element={
                        <RoleRoute roles={[ROLES.ADMIN, ROLES.SUBADMIN]}>
                            <Users />
                        </RoleRoute>
                    }
                />
            </Route>
        </Routes>
    );
}

export default App;
