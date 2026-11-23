import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart, Droplet, Shield, Users, Phone, MessageCircle, Search, Plus,
  Trash2, LogOut, Upload, Download, Award, AlertTriangle, CheckCircle2,
  Clock, FileText, Eye, X, Copy, Share2, UserPlus, Activity
} from 'lucide-react';
import { INITIAL_USERS, INITIAL_DONORS, INITIAL_DONATIONS, INITIAL_CASES } from './initialData';
import { getEligibilityInfo, formatWhatsAppNumber, generateSOSMessage } from './utils';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function useLocalState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

export default function App() {
  const [users, setUsers] = useLocalState('aashay_users', INITIAL_USERS);
  const [donors, setDonors] = useLocalState('aashay_donors', INITIAL_DONORS);
  const [donations, setDonations] = useLocalState('aashay_donations', INITIAL_DONATIONS);
  const [cases, setCases] = useLocalState('aashay_cases', INITIAL_CASES);
  const [auditLogs, setAuditLogs] = useLocalState('aashay_audit_logs', []);
  const [currentUser, setCurrentUser] = useLocalState('aashay_session', null);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('donors');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [certificateDonation, setCertificateDonation] = useState(null);
  const [sosCase, setSosCase] = useState(null);
  const [copiedSos, setCopiedSos] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBlood, setFilterBlood] = useState('');
  const [filterSDP, setFilterSDP] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterResidence, setFilterResidence] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [filterMinHb, setFilterMinHb] = useState('');

  // Modals for adding items
  const [showAddDonor, setShowAddDonor] = useState(false);
  const [showAddDonation, setShowAddDonation] = useState(false);
  const [showAddCase, setShowAddCase] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  const [newDonor, setNewDonor] = useState({
    name: '', role: 'Student', department: '', residence: 'Hosteller',
    bloodGroup: 'O+', sdpEligible: false, hemoglobin: '', phone: '', whatsapp: '',
    lastDonationDate: '', lastDonationType: 'Whole Blood'
  });

  const [newDonation, setNewDonation] = useState({
    donorId: '', date: new Date().toISOString().split('T')[0],
    type: 'Whole Blood', hospital: '', coordinator: '', paymentDetails: ''
  });

  const [newCase, setNewCase] = useState({
    patientName: '', hospital: '', bloodGroup: 'O+', units: 1,
    urgency: 'Critical', coordinator: '', status: 'Pending'
  });

  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', role: 'member', designation: 'Volunteer'
  });

  const isAdmin = currentUser?.role === 'admin';

  // Login Handler
  const handleLogin = (e) => {
    e.preventDefault();
    const found = users.find(
      (u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase() && u.password === loginPassword
    );
    if (!found) {
      setLoginError('Invalid email or password. Contact Main Admin for access.');
      return;
    }
    setCurrentUser(found);
    setShowLoginModal(false);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
  };

  // Open donor profile + log audit
  const handleOpenDonor = (donor) => {
    setSelectedDonor(donor);
    if (currentUser) {
      const entry = {
        id: 'aud_' + Date.now(),
        viewerName: currentUser.name,
        viewerRole: currentUser.role,
        donorName: donor.name,
        donorBloodGroup: donor.bloodGroup,
        timestamp: new Date().toLocaleString('en-IN')
      };
      setAuditLogs((prev) => [entry, ...prev]);
    }
  };

  // Filtered Donors
  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      const elig = getEligibilityInfo(d.lastDonationDate, d.lastDonationType);
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!d.name.toLowerCase().includes(q) && !d.department.toLowerCase().includes(q)) return false;
      }
      if (filterBlood && d.bloodGroup !== filterBlood) return false;
      if (filterSDP === 'yes' && !d.sdpEligible) return false;
      if (filterSDP === 'no' && d.sdpEligible) return false;
      if (filterRole && d.role !== filterRole) return false;
      if (filterResidence && d.residence !== filterResidence) return false;
      if (filterAvailability === 'available' && !elig.available) return false;
      if (filterAvailability === 'resting' && elig.available) return false;
      if (filterMinHb && Number(d.hemoglobin) < Number(filterMinHb)) return false;
      return true;
    });
  }, [donors, searchQuery, filterBlood, filterSDP, filterRole, filterResidence, filterAvailability, filterMinHb]);

  // Add Donor
  const handleAddDonor = (e) => {
    e.preventDefault();
    const record = {
      ...newDonor,
      id: 'd_' + Date.now(),
      hemoglobin: Number(newDonor.hemoglobin) || 0,
      whatsapp: newDonor.whatsapp || newDonor.phone
    };
    setDonors((prev) => [record, ...prev]);
    setShowAddDonor(false);
    setNewDonor({
      name: '', role: 'Student', department: '', residence: 'Hosteller',
      bloodGroup: 'O+', sdpEligible: false, hemoglobin: '', phone: '', whatsapp: '',
      lastDonationDate: '', lastDonationType: 'Whole Blood'
    });
  };

  // Delete Donor (Admin only)
  const handleDeleteDonor = (id) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to delete this donor record?')) {
      setDonors((prev) => prev.filter((d) => d.id !== id));
      if (selectedDonor?.id === id) setSelectedDonor(null);
    }
  };

  // Log Donation + Auto-update donor cooldown
  const handleAddDonation = (e) => {
    e.preventDefault();
    const donor = donors.find((d) => d.id === newDonation.donorId);
    if (!donor) return;
    const entry = {
      id: 'don_' + Date.now(),
      donorId: donor.id,
      donorName: donor.name,
      bloodGroup: donor.bloodGroup,
      date: newDonation.date,
      type: newDonation.type,
      hospital: newDonation.hospital,
      coordinator: newDonation.coordinator || currentUser.name,
      paymentDetails: newDonation.paymentDetails || 'No expenses recorded'
    };
    setDonations((prev) => [entry, ...prev]);
    setDonors((prev) =>
      prev.map((d) =>
        d.id === donor.id
          ? { ...d, lastDonationDate: newDonation.date, lastDonationType: newDonation.type }
          : d
      )
    );
    setShowAddDonation(false);
    setNewDonation({
      donorId: '', date: new Date().toISOString().split('T')[0],
      type: 'Whole Blood', hospital: '', coordinator: '', paymentDetails: ''
    });
  };

  // Add Case
  const handleAddCase = (e) => {
    e.preventDefault();
    const entry = {
      ...newCase,
      id: 'c_' + Date.now(),
      units: Number(newCase.units) || 1,
      coordinator: newCase.coordinator || currentUser.name,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCases((prev) => [entry, ...prev]);
    setShowAddCase(false);
    setNewCase({
      patientName: '', hospital: '', bloodGroup: 'O+', units: 1,
      urgency: 'Critical', coordinator: '', status: 'Pending'
    });
  };

  const handleUpdateCaseStatus = (id, status) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  // CSV Template Download
  const downloadCsvTemplate = () => {
    const header = 'Name,Role,Department,Residence,BloodGroup,SDPEligible,Hemoglobin,Phone,WhatsApp,LastDonationDate\n';
    const sample = 'Rohan Sharma,Student,CSE - 1st Year,Hosteller,B+,Yes,14.5,9829011223,9829011223,2026-05-10\n';
    const blob = new Blob([header + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aashay_donors_template.csv';
    a.click();
  };

  // Bulk CSV Import
  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) return;
      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (!cols[0]) continue;
        imported.push({
          id: 'd_csv_' + Date.now() + '_' + i,
          name: cols[0],
          role: cols[1] === 'Non-Teaching Staff' ? 'Non-Teaching Staff' : 'Student',
          department: cols[2] || 'General',
          residence: cols[3] === 'Day Scholar' ? 'Day Scholar' : 'Hosteller',
          bloodGroup: BLOOD_GROUPS.includes(cols[4]) ? cols[4] : 'O+',
          sdpEligible: (cols[5] || '').toLowerCase() === 'yes' || (cols[5] || '').toLowerCase() === 'true',
          hemoglobin: parseFloat(cols[6]) || 13.5,
          phone: cols[7] || '',
          whatsapp: cols[8] || cols[7] || '',
          lastDonationDate: cols[9] || '',
          lastDonationType: 'Whole Blood'
        });
      }
      if (imported.length > 0) {
        setDonors((prev) => [...imported, ...prev]);
        alert(`Successfully imported ${imported.length} donor records!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Add Team Member (Admin)
  const handleAddUser = (e) => {
    e.preventDefault();
    setUsers((prev) => [...prev, { ...newUser, id: 'u_' + Date.now() }]);
    setShowAddUser(false);
    setNewUser({ name: '', email: '', password: '', role: 'member', designation: 'Volunteer' });
  };

  const activeCasesCount = cases.filter((c) => c.status !== 'Fulfilled').length;

  // ==================== LANDING PAGE (NOT LOGGED IN) ====================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm">
                <Droplet className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 leading-tight">Aashay Team</h1>
                <p className="text-xs font-medium text-red-600">JCERC Foundation</p>
              </div>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition shadow-sm flex items-center gap-2"
            >
              <Shield className="w-4 h-4" /> Team Login
            </button>
          </div>
        </header>

        <main className="flex-1">
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-700 text-xs font-semibold mb-6">
              <Heart className="w-3.5 h-3.5 fill-red-600 text-red-600" />
              Official Blood Donation & Emergency Coordination Portal
            </div>

            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white shadow-lg">
              <Droplet className="w-12 h-12 fill-current" />
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Aashay Team <span className="text-red-600">JCERC Foundation</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
              Connecting students and non-teaching staff of JCERC Foundation for rapid,
              reliable emergency blood and SDP coordination—saving lives when every minute counts.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md transition flex items-center gap-2"
              >
                <Shield className="w-5 h-5" /> Authorized Team Login
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left">
                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900">{donors.length}</p>
                <p className="text-sm font-medium text-slate-600">Registered Campus Donors</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                  <Heart className="w-5 h-5" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900">{donations.length}</p>
                <p className="text-sm font-medium text-slate-600">Lives Impacted / Donations Logged</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900">{activeCasesCount}</p>
                <p className="text-sm font-medium text-slate-600">Active Emergency Cases</p>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Aashay Team JCERC Foundation. Restricted internal emergency portal.
        </footer>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Team Portal Login</h3>
                <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Access is restricted to Main Admins and Authorized Team Members.
              </p>
              {loginError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {loginError}
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@aashayjcerc.org"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                >
                  Sign In
                </button>
              </form>
              <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">Default Demo Credentials:</p>
                <p><strong>Main Admin:</strong> admin@aashayjcerc.org / admin123</p>
                <p><strong>Team Member:</strong> member@aashayjcerc.org / member123</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== DASHBOARD (LOGGED IN) ====================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white">
              <Droplet className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Aashay Team JCERC Foundation
              </h1>
              <span className="text-xs font-medium text-slate-500">
                {currentUser.name} •{' '}
                <span className={isAdmin ? 'text-red-600 font-semibold' : 'text-blue-600 font-semibold'}>
                  {isAdmin ? 'Main Admin' : 'Team Member'}
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setCurrentUser(null)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-medium flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {[
            { id: 'donors', label: 'Donor Directory', icon: Users },
            { id: 'cases', label: `Live Cases (${activeCasesCount})`, icon: AlertTriangle },
            { id: 'donations', label: 'Donation Logs', icon: FileText },
            ...(isAdmin
              ? [
                  { id: 'audit', label: 'Audit Logs', icon: Eye },
                  { id: 'team', label: 'Team Access', icon: Shield }
                ]
              : [])
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                  active
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 no-print">
        {/* ==================== TAB 1: DONOR DIRECTORY ==================== */}
        {activeTab === 'donors' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Campus Donor Database</h2>
                <p className="text-sm text-slate-500">
                  Showing {filteredDonors.length} of {donors.length} registered students & staff
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={downloadCsvTemplate}
                      className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" /> CSV Template
                    </button>
                    <label className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-4 h-4" /> Bulk Import CSV
                      <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                    </label>
                    <button
                      onClick={() => setShowAddDonor(true)}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Donor
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Smart Multi-Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <select
                value={filterBlood}
                onChange={(e) => setFilterBlood(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="">All Blood Groups</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
              <select
                value={filterSDP}
                onChange={(e) => setFilterSDP(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="">SDP: Any</option>
                <option value="yes">SDP Eligible</option>
                <option value="no">Not SDP Eligible</option>
              </select>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="">All Roles</option>
                <option value="Student">Student</option>
                <option value="Non-Teaching Staff">Non-Teaching Staff</option>
              </select>
              <select
                value={filterResidence}
                onChange={(e) => setFilterResidence(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Hosteller / Day</option>
                <option value="Hosteller">Hosteller</option>
                <option value="Day Scholar">Day Scholar</option>
              </select>
              <select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="">All Statuses</option>
                <option value="available">Available Now</option>
                <option value="resting">Resting / Cooldown</option>
              </select>
            </div>

            {/* Donor Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDonors.map((donor) => {
                const elig = getEligibilityInfo(donor.lastDonationDate, donor.lastDonationType);
                return (
                  <div
                    key={donor.id}
                    onClick={() => handleOpenDonor(donor)}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:border-red-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{donor.name}</h3>
                          <p className="text-xs text-slate-500">
                            {donor.role} • {donor.department}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 font-extrabold text-sm">
                          {donor.bloodGroup}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          {donor.residence}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          Hb: {donor.hemoglobin} g/dL
                        </span>
                        {donor.sdpEligible && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium">
                            SDP Ready
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      {elig.available ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5" /> Resting until {elig.eligibleDate}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-red-600">View Profile →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: LIVE CASES ==================== */}
        {activeTab === 'cases' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Live Emergency Cases</h2>
                <p className="text-sm text-slate-500">Track active blood requirements and broadcast SOS alerts</p>
              </div>
              <button
                onClick={() => setShowAddCase(true)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> New Emergency Case
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cases.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{c.patientName}</h3>
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-bold">
                          {c.bloodGroup} ({c.units} Unit{c.units > 1 ? 's' : ''})
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">{c.hospital}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.urgency === 'Critical'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.urgency}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>Coordinator: <strong className="text-slate-700">{c.coordinator}</strong></span>
                    <span>Logged: {c.createdAt}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <select
                      value={c.status}
                      onChange={(e) => handleUpdateCaseStatus(c.id, e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Fulfilled">Fulfilled</option>
                    </select>
                    <button
                      onClick={() => { setSosCase(c); setCopiedSos(false); }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Generate SOS WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: DONATION LOGS ==================== */}
        {activeTab === 'donations' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Donation History & Coordination Logs</h2>
                <p className="text-sm text-slate-500">All-in-one record of donations, coordinators, payments, and certificates</p>
              </div>
              <button
                onClick={() => setShowAddDonation(true)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Log New Donation
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Donor</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Hospital / Patient</th>
                    <th className="px-4 py-3 font-semibold">Coordinator</th>
                    <th className="px-4 py-3 font-semibold">Payment / Expense</th>
                    <th className="px-4 py-3 font-semibold text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donations.map((don) => (
                    <tr key={don.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{don.date}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900">{don.donorName}</span>{' '}
                        <span className="text-xs font-bold text-red-600">({don.bloodGroup})</span>
                      </td>
                      <td className="px-4 py-3">{don.type}</td>
                      <td className="px-4 py-3">{don.hospital}</td>
                      <td className="px-4 py-3">{don.coordinator}</td>
                      <td className="px-4 py-3 text-slate-600">{don.paymentDetails}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setCertificateDonation(don)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold"
                        >
                          <Award className="w-3.5 h-3.5" /> Certificate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: AUDIT LOGS (ADMIN ONLY) ==================== */}
        {activeTab === 'audit' && isAdmin && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Privacy & Security Audit Logs</h2>
              <p className="text-sm text-slate-500">Tracks every time a team member views a donor's contact details</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Timestamp</th>
                    <th className="px-4 py-3 font-semibold">Team Member</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Donor Profile Viewed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                        No profile views recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 text-slate-600">{log.timestamp}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{log.viewerName}</td>
                        <td className="px-4 py-3 uppercase text-xs font-bold text-slate-500">{log.viewerRole}</td>
                        <td className="px-4 py-3">
                          {log.donorName} <span className="text-red-600 font-bold">({log.donorBloodGroup})</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: TEAM ACCESS (ADMIN ONLY) ==================== */}
        {activeTab === 'team' && isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Authorized Team Accounts</h2>
                <p className="text-sm text-slate-500">Provision login credentials for Main Admins and Team Members</p>
              </div>
              <button
                onClick={() => setShowAddUser(true)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" /> Add Team Member
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Designation</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-semibold">{u.name}</td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role === 'admin' ? 'Main Admin' : 'Team Member'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.designation}</td>
                      <td className="px-4 py-3 text-right">
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => setUsers((prev) => prev.filter((x) => x.id !== u.id))}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ==================== DONOR PROFILE MODAL ==================== */}
      {selectedDonor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedDonor.name}</h3>
                <p className="text-sm text-slate-500">{selectedDonor.role} • {selectedDonor.department}</p>
              </div>
              <button onClick={() => setSelectedDonor(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
              <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-xs text-red-600 font-medium">Blood Group</p>
                <p className="text-xl font-extrabold text-red-700">{selectedDonor.bloodGroup}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">Hemoglobin (Hb)</p>
                <p className="text-xl font-bold text-slate-900">{selectedDonor.hemoglobin} g/dL</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">SDP Eligibility</p>
                <p className="font-semibold text-slate-900">{selectedDonor.sdpEligible ? 'Yes (Eligible)' : 'No'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">Residence</p>
                <p className="font-semibold text-slate-900">{selectedDonor.residence}</p>
              </div>
            </div>

            {/* One-Click Emergency Contact Actions */}
            <div className="flex gap-3 mb-5">
              <a
                href={`tel:${selectedDonor.phone}`}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> Call {selectedDonor.phone}
              </a>
              <a
                href={`https://wa.me/${formatWhatsAppNumber(selectedDonor.whatsapp)}?text=${encodeURIComponent(
                  `Hello ${selectedDonor.name}, this is ${currentUser.name} from Aashay Team JCERC Foundation. We have an urgent ${selectedDonor.bloodGroup} blood requirement.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>

            {/* Donor's Past Donations */}
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-bold text-slate-900 mb-2">Donation History</h4>
              {donations.filter((d) => d.donorId === selectedDonor.id).length === 0 ? (
                <p className="text-xs text-slate-500">No donations logged through the club yet.</p>
              ) : (
                <div className="space-y-2">
                  {donations
                    .filter((d) => d.donorId === selectedDonor.id)
                    .map((don) => (
                      <div key={don.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-900">{don.date} — {don.type} ({don.hospital})</p>
                          <p className="text-slate-600">Coordinator: {don.coordinator} • {don.paymentDetails}</p>
                        </div>
                        <button
                          onClick={() => setCertificateDonation(don)}
                          className="text-red-600 font-semibold hover:underline"
                        >
                          Certificate
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="mt-5 pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => handleDeleteDonor(selectedDonor.id)}
                  className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Donor Record
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SOS MESSAGE MODAL ==================== */}
      {sosCase && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900">Emergency SOS Broadcast</h3>
              <button onClick={() => setSosCase(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 font-sans text-slate-800 mb-4">
              {generateSOSMessage(sosCase)}
            </pre>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateSOSMessage(sosCase));
                  setCopiedSos(true);
                }}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-slate-50"
              >
                <Copy className="w-4 h-4" /> {copiedSos ? 'Copied!' : 'Copy Text'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(generateSOSMessage(sosCase))}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" /> Share on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ==================== APPRECIATION CERTIFICATE MODAL ==================== */}
      {certificateDonation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 no-print">
              <h3 className="font-bold text-slate-900">Certificate of Appreciation</h3>
              <button onClick={() => setCertificateDonation(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-8 border-double border-red-600 rounded-xl p-8 text-center bg-gradient-to-b from-white to-red-50/40">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-600 text-white flex items-center justify-center">
                <Droplet className="w-7 h-7 fill-current" />
              </div>
              <p className="text-xs font-bold tracking-widest uppercase text-red-600 mb-1">
                Aashay Team JCERC Foundation
              </p>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                Certificate of Appreciation
              </h2>
              <p className="text-sm text-slate-600 mb-4">This certificate is proudly presented to</p>
              <p className="text-2xl font-extrabold text-red-700 border-b-2 border-red-200 inline-block px-6 pb-1 mb-4">
                {certificateDonation.donorName}
              </p>
              <p className="text-sm text-slate-700 max-w-md mx-auto mb-6">
                In heartfelt recognition of your selfless <strong>{certificateDonation.type}</strong> donation
                (Blood Group: <strong>{certificateDonation.bloodGroup}</strong>) on{' '}
                <strong>{certificateDonation.date}</strong> at <strong>{certificateDonation.hospital}</strong>.
                Your kindness helps save precious lives.
              </p>
              <div className="flex justify-between items-end pt-6 border-t border-red-100 text-xs text-slate-600">
                <div>
                  <p className="font-bold text-slate-900">{certificateDonation.coordinator}</p>
                  <p>Accompanying Coordinator</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Aashay Team JCERC Foundation</p>
                  <p>Official Blood Donation Club</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD DONOR MODAL ==================== */}
      {showAddDonor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New Donor</h3>
              <button onClick={() => setShowAddDonor(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddDonor} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <input required placeholder="Full Name" value={newDonor.name} onChange={(e) => setNewDonor({ ...newDonor, name: e.target.value })} className="sm:col-span-2 px-3 py-2 border rounded-lg" />
              <select value={newDonor.role} onChange={(e) => setNewDonor({ ...newDonor, role: e.target.value })} className="px-3 py-2 border rounded-lg bg-white">
                <option value="Student">Student</option>
                <option value="Non-Teaching Staff">Non-Teaching Staff</option>
              </select>
              <input required placeholder="Dept & Year / Designation" value={newDonor.department} onChange={(e) => setNewDonor({ ...newDonor, department: e.target.value })} className="px-3 py-2 border rounded-lg" />
              <select value={newDonor.residence} onChange={(e) => setNewDonor({ ...newDonor, residence: e.target.value })} className="px-3 py-2 border rounded-lg bg-white">
                <option value="Hosteller">Hosteller</option>
                <option value="Day Scholar">Day Scholar</option>
              </select>
              <select value={newDonor.bloodGroup} onChange={(e) => setNewDonor({ ...newDonor, bloodGroup: e.target.value })} className="px-3 py-2 border rounded-lg bg-white">
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
              <input required type="number" step="0.1" placeholder="Hemoglobin (g/dL)" value={newDonor.hemoglobin} onChange={(e) => setNewDonor({ ...newDonor, hemoglobin: e.target.value })} className="px-3 py-2 border rounded-lg" />
              <label className="flex items-center gap-2 px-3 py-2 border rounded-lg">
                <input type="checkbox" checked={newDonor.sdpEligible} onChange={(e) => setNewDonor({ ...newDonor, sdpEligible: e.target.checked })} />
                <span>SDP Eligible</span>
              </label>
              <input required placeholder="Phone Number" value={newDonor.phone} onChange={(e) => setNewDonor({ ...newDonor, phone: e.target.value })} className="px-3 py-2 border rounded-lg" />
              <input placeholder="WhatsApp Number (optional)" value={newDonor.whatsapp} onChange={(e) => setNewDonor({ ...newDonor, whatsapp: e.target.value })} className="px-3 py-2 border rounded-lg" />
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500">Last Donation Date (leave blank if never)</label>
                <input type="date" value={newDonor.lastDonationDate} onChange={(e) => setNewDonor({ ...newDonor, lastDonationDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <button type="submit" className="sm:col-span-2 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                Save Donor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD DONATION MODAL ==================== */}
      {showAddDonation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Log Completed Donation</h3>
              <button onClick={() => setShowAddDonation(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddDonation} className="space-y-3 text-sm">
              <select required value={newDonation.donorId} onChange={(e) => setNewDonation({ ...newDonation, donorId: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white">
                <option value="">Select Donor...</option>
                {donors.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.bloodGroup})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input required type="date" value={newDonation.date} onChange={(e) => setNewDonation({ ...newDonation, date: e.target.value })} className="px-3 py-2 border rounded-lg" />
                <select value={newDonation.type} onChange={(e) => setNewDonation({ ...newDonation, type: e.target.value })} className="px-3 py-2 border rounded-lg bg-white">
                  <option value="Whole Blood">Whole Blood</option>
                  <option value="SDP">SDP</option>
                </select>
              </div>
              <input required placeholder="Hospital / Patient Name" value={newDonation.hospital} onChange={(e) => setNewDonation({ ...newDonation, hospital: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input required placeholder="Accompanying Coordinator Name" value={newDonation.coordinator} onChange={(e) => setNewDonation({ ...newDonation, coordinator: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Payment / Expense Details (e.g., ₹200 travel)" value={newDonation.paymentDetails} onChange={(e) => setNewDonation({ ...newDonation, paymentDetails: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <button type="submit" className="w-full py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                Save Donation & Start Cooldown
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD CASE MODAL ==================== */}
      {showAddCase && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">New Emergency Blood Case</h3>
              <button onClick={() => setShowAddCase(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCase} className="space-y-3 text-sm">
              <input required placeholder="Patient Name" value={newCase.patientName} onChange={(e) => setNewCase({ ...newCase, patientName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input required placeholder="Hospital & Ward" value={newCase.hospital} onChange={(e) => setNewCase({ ...newCase, hospital: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <div className="grid grid-cols-3 gap-2">
                <select value={newCase.bloodGroup} onChange={(e) => setNewCase({ ...newCase, bloodGroup: e.target.value })} className="px-3 py-2 border rounded-lg bg-white">
                  {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
                <input required type="number" min="1" placeholder="Units" value={newCase.units} onChange={(e) => setNewCase({ ...newCase, units: e.target.value })} className="px-3 py-2 border rounded-lg" />
                <select value={newCase.urgency} onChange={(e) => setNewCase({ ...newCase, urgency: e.target.value })} className="px-3 py-2 border rounded-lg bg-white">
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>
              <input required placeholder="Assigned Coordinator" value={newCase.coordinator} onChange={(e) => setNewCase({ ...newCase, coordinator: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <button type="submit" className="w-full py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                Create Case
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD TEAM MEMBER MODAL ==================== */}
      {showAddUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Authorized Team Member</h3>
              <button onClick={() => setShowAddUser(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-3 text-sm">
              <input required placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input required type="email" placeholder="Email Address" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input required type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white">
                <option value="member">Authorized Team Member</option>
                <option value="admin">Main Admin</option>
              </select>
              <input placeholder="Designation (e.g., Coordinator)" value={newUser.designation} onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <button type="submit" className="w-full py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
