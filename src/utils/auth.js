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
}
