import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ImportPage } from './pages/ImportPage';
import { FindingsPage } from './pages/FindingsPage';
import { CodeSmellsPage } from './pages/CodeSmellsPage';
import { SecurityPage } from './pages/SecurityPage';
import { AnalysisHistoryPage } from './pages/AnalysisHistoryPage';
import { ScanCompareModal } from './components/ScanCompareModal';
import { Project } from './types';
import { fetchProjects } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const loadProjects = () => {
    fetchProjects()
      .then((projs) => {
        setProjects(projs);
        if (projs.length > 0 && !activeProject) {
          setActiveProject(projs[0]);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleRefresh = () => {
    loadProjects();
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen max-w-full overflow-x-hidden bg-background text-slate-100 font-sans">
      {/* Sidebar (Desktop persistent + Mobile slide-over drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        <Navbar
          activeTab={activeTab}
          projects={projects}
          activeProject={activeProject}
          onSelectProject={(proj) => {
            setActiveProject(proj);
            handleRefresh();
          }}
          onProjectCreated={(proj) => {
            setProjects((prev) => [proj, ...prev]);
            setActiveProject(proj);
            handleRefresh();
          }}
          onRefresh={handleRefresh}
          onOpenCompare={() => setShowCompareModal(true)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 overflow-y-auto w-full min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardPage key={`${activeProject?.id}-${refreshKey}`} activeProject={activeProject} onNavigateTab={setActiveTab} />
          )}
          {activeTab === 'import' && (
            <ImportPage
              key={`${activeProject?.id}-${refreshKey}`}
              projects={projects}
              activeProject={activeProject}
              onSuccessImport={() => {
                handleRefresh();
                setActiveTab('dashboard');
              }}
            />
          )}
          {activeTab === 'findings' && <FindingsPage key={`${activeProject?.id}-${refreshKey}`} activeProject={activeProject} />}
          {activeTab === 'code-smells' && <CodeSmellsPage key={`${activeProject?.id}-${refreshKey}`} activeProject={activeProject} />}
          {activeTab === 'security' && <SecurityPage key={`${activeProject?.id}-${refreshKey}`} activeProject={activeProject} />}
          {activeTab === 'history' && (
            <AnalysisHistoryPage
              key={`${activeProject?.id}-${refreshKey}`}
              activeProject={activeProject}
              onOpenCompare={() => setShowCompareModal(true)}
            />
          )}
        </main>
      </div>

      {/* Scan Regression Comparison Modal */}
      {showCompareModal && (
        <ScanCompareModal activeProject={activeProject} onClose={() => setShowCompareModal(false)} />
      )}
    </div>
  );
}

export default App;
