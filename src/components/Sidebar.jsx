import { NavLink } from "react-router-dom";
import {
    canApprove,
    canCreateUser,
    canManageBank,
    canManageBranch
} from "../utils/auth";

function Sidebar() {
    return (
        <div className="sidebar">
            <h2>Banking</h2>

            <NavLink to="/">Dashboard</NavLink>

            {canManageBank() && <NavLink to="/banks">Bank</NavLink>}

            {canManageBranch() && <NavLink to="/branches">Branch</NavLink>}

            <NavLink to="/accounts">Account</NavLink>

            <NavLink to="/transactions">Transaction</NavLink>

            {canApprove() && <NavLink to="/approvals">Approvals</NavLink>}

            {canCreateUser() && <NavLink to="/users">Users</NavLink>}
        </div>
    );
}

export default Sidebar;
