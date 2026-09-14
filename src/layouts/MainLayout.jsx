import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

function MainLayout() {
    return (
        <div className="container">

            <Sidebar />

            <div className="main">

                <Header />

                <div className="content">
                    <Outlet />
                </div>

            </div>

        </div>
    );
}

export default MainLayout;