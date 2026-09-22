export const ROLES = {
    ADMIN: "ADMIN",
    SUBADMIN: "SUBADMIN",
    EMPLOYEE: "EMPLOYEE",
    BANK: "BANK",
    BRANCH: "BRANCH"
};

export function getCurrentUser() {
    const raw = localStorage.getItem("user");

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function isAuthenticated() {
    return Boolean(localStorage.getItem("token") && getCurrentUser());
}

export function hasRole(...roles) {
    const user = getCurrentUser();
    return Boolean(user && roles.includes(user.role));
}

export function canManageBank() {
    return hasRole(ROLES.ADMIN);
}

export function canManageBranch() {
    return hasRole(ROLES.ADMIN, ROLES.SUBADMIN, ROLES.BANK);
}

export function canManageAccount() {
    return hasRole(ROLES.ADMIN, ROLES.SUBADMIN, ROLES.EMPLOYEE, ROLES.BANK, ROLES.BRANCH);
}

export function isReadOnlyScope() {
    return hasRole(ROLES.BRANCH);
}

export function canExecuteTransaction() {
    return hasRole(ROLES.ADMIN, ROLES.SUBADMIN, ROLES.EMPLOYEE, ROLES.BANK, ROLES.BRANCH);
}

export function canCreateUser() {
    return hasRole(ROLES.ADMIN, ROLES.SUBADMIN);
}

export function canApprove() {
    return hasRole(ROLES.ADMIN);
}

/**
 * Role nào creator được phép tạo
 */
export function getCreatableRoles() {
    const user = getCurrentUser();
    if (!user) return [];

    if (user.role === ROLES.ADMIN) {
        return [ROLES.SUBADMIN, ROLES.EMPLOYEE];
    }

    if (user.role === ROLES.SUBADMIN) {
        return [ROLES.EMPLOYEE];
    }

    return [];
}

export function clearAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("customerAccount");
    localStorage.removeItem("tokenExpiresAt");
    // Xóa cookie customer_token phía client (nếu không HttpOnly) – backend cũng clear khi logout
    document.cookie = "customer_token=; Path=/; Max-Age=0; SameSite=Lax";
}

/**
 * Lưu phiên đăng nhập khách hàng (token + thời điểm hết hạn).
 * Token được backend set vào cookie HttpOnly; frontend giữ expiresAt để tự logout.
 */
export function saveCustomerSession({ token, user, account, expiresAt, expiresIn }) {
    if (token) localStorage.setItem("token", token);
    if (user) localStorage.setItem("user", JSON.stringify({ ...user, role: "CUSTOMER" }));
    if (account) localStorage.setItem("customerAccount", JSON.stringify(account));
    const exp =
        expiresAt ||
        (expiresIn ? Date.now() + Number(expiresIn) * 1000 : Date.now() + 15000);
    localStorage.setItem("tokenExpiresAt", String(exp));
}

export function getTokenExpiresAt() {
    const raw = localStorage.getItem("tokenExpiresAt");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

export function isTokenExpired() {
    const exp = getTokenExpiresAt();
    if (!exp) return false;
    return Date.now() >= exp;
}