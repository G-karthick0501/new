// src/pages/CandidateDashboard.jsx
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/shared/DashboardLayout";
import Overview from "../components/candidate/Overview";
import JobApplications from "../components/candidate/JobApplications";
import CodingPractice from "../components/candidate/CodingPractice";
import MockInterview from "../components/candidate/MockInterview";
import ResumeAnalyzer from "../components/candidate/ResumeAnalyzer/ResumeAnalyzer";

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'resume', label: 'Resume Optimizer' },
    { id: 'interview', label: 'Mock Interview' },
    { id: 'coding', label: 'Coding Practice' },
    { id: 'jobs', label: 'Job Applications' }
  ];

  return (
    <DashboardLayout
      title="Candidate Dashboard"
      subtitle={`Welcome back, <strong>${user?.name}</strong>`}
      activeTab={activeTab}
      tabs={tabs}
      onTabChange={setActiveTab}
      accentColor="#007bff"
    >
      {activeTab === 'overview' && <Overview />}
      {activeTab === 'resume' && <ResumeAnalyzer />}
      {activeTab === 'interview' && <MockInterview />}
      {activeTab === 'coding' && <CodingPractice />}
      {activeTab === 'jobs' && <JobApplications />}
    </DashboardLayout>
  );
}