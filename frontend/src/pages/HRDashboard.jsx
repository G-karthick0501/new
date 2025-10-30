// src/pages/HRDashboard.jsx
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/shared/DashboardLayout";
import Overview from "../components/hr/Overview";
import CandidateManagement from "../components/hr/CandidateManagement";
import JobManagement from "../components/hr/JobManagement";
import InterviewManagement from "../components/hr/InterviewManagement";
import Analytics from "../components/hr/Analytics";

export default function HRDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'candidates', label: '👥 Candidates' },
    { id: 'jobs', label: '💼 Job Posts' },
    { id: 'interviews', label: '🎤 Interviews' },
    { id: 'analytics', label: '📈 Analytics' }
  ];

  return (
    <DashboardLayout
      title="HR Dashboard"
      subtitle={`Manage your recruitment pipeline, <strong>${user?.name}</strong>! 💼`}
      activeTab={activeTab}
      tabs={tabs}
      onTabChange={setActiveTab}
      accentColor="#28a745"
    >
      {activeTab === 'overview' && <Overview />}
      {activeTab === 'candidates' && <CandidateManagement />}
      {activeTab === 'jobs' && <JobManagement />}
      {activeTab === 'interviews' && <InterviewManagement />}
      {activeTab === 'analytics' && <Analytics />}
    </DashboardLayout>
  );
}