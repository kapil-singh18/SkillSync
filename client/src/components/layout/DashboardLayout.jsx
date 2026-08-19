import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * DashboardLayout — wraps all authenticated pages.
 * Renders the fixed Sidebar + fixed Topbar and an offset main content area.
 */
const DashboardLayout = ({ children }) => {
  return (
    <div className="layout-root">
      <Sidebar />
      <Topbar />
      <main className="main-content">{children}</main>
    </div>
  );
};

export default DashboardLayout;
