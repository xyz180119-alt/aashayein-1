export const INITIAL_USERS = [
  {
    id: 'u1',
    name: 'Main Admin (Aashay Lead)',
    email: 'admin@aashayjcerc.org',
    password: 'admin123',
    role: 'admin',
    designation: 'Club Coordinator'
  },
  {
    id: 'u2',
    name: 'Rahul Sharma',
    email: 'member@aashayjcerc.org',
    password: 'member123',
    role: 'member',
    designation: 'Authorized Volunteer'
  }
];

export const INITIAL_DONORS = [
  {
    id: 'd1',
    name: 'Aarav Verma',
    role: 'Student',
    department: 'CSE - 2nd Year',
    residence: 'Hosteller',
    bloodGroup: 'O+',
    sdpEligible: true,
    hemoglobin: 14.8,
    phone: '9829012345',
    whatsapp: '9829012345',
    lastDonationDate: '2026-06-15',
    lastDonationType: 'Whole Blood'
  },
  {
    id: 'd2',
    name: 'Priya Meena',
    role: 'Student',
    department: 'ECE - 3rd Year',
    residence: 'Day Scholar',
    bloodGroup: 'A+',
    sdpEligible: false,
    hemoglobin: 12.9,
    phone: '9829054321',
    whatsapp: '9829054321',
    lastDonationDate: '2026-10-20',
    lastDonationType: 'Whole Blood'
  },
  {
    id: 'd3',
    name: 'Ramesh Kumar',
    role: 'Non-Teaching Staff',
    department: 'Lab Assistant - Physics',
    residence: 'Day Scholar',
    bloodGroup: 'B+',
    sdpEligible: true,
    hemoglobin: 15.1,
    phone: '9829098765',
    whatsapp: '9829098765',
    lastDonationDate: '',
    lastDonationType: ''
  },
  {
    id: 'd4',
    name: 'Karan Singh',
    role: 'Student',
    department: 'Mechanical - 1st Year',
    residence: 'Hosteller',
    bloodGroup: 'AB-',
    sdpEligible: true,
    hemoglobin: 14.2,
    phone: '9829077788',
    whatsapp: '9829077788',
    lastDonationDate: '2026-11-15',
    lastDonationType: 'SDP'
  },
  {
    id: 'd5',
    name: 'Sneha Gupta',
    role: 'Student',
    department: 'IT - 4th Year',
    residence: 'Hosteller',
    bloodGroup: 'O-',
    sdpEligible: false,
    hemoglobin: 13.4,
    phone: '9829033344',
    whatsapp: '9829033344',
    lastDonationDate: '2026-04-10',
    lastDonationType: 'Whole Blood'
  }
];

export const INITIAL_DONATIONS = [
  {
    id: 'don1',
    donorId: 'd2',
    donorName: 'Priya Meena',
    bloodGroup: 'A+',
    date: '2026-10-20',
    type: 'Whole Blood',
    hospital: 'SMS Hospital, Jaipur',
    coordinator: 'Rahul Sharma',
    paymentDetails: '₹250 auto conveyance reimbursed'
  },
  {
    id: 'don2',
    donorId: 'd4',
    donorName: 'Karan Singh',
    bloodGroup: 'AB-',
    date: '2026-11-15',
    type: 'SDP',
    hospital: 'Fortis Escorts, Jaipur',
    coordinator: 'Main Admin (Aashay Lead)',
    paymentDetails: '₹400 travel + refreshments'
  }
];

export const INITIAL_CASES = [
  {
    id: 'c1',
    patientName: 'Suresh Agarwal',
    hospital: 'SMS Hospital, Jaipur (Trauma Ward)',
    bloodGroup: 'O+',
    units: 2,
    urgency: 'Critical',
    coordinator: 'Rahul Sharma',
    status: 'In Progress',
    createdAt: '2026-11-23'
  },
  {
    id: 'c2',
    patientName: 'Meera Devi',
    hospital: 'Mahatma Gandhi Hospital, Sitapura',
    bloodGroup: 'B+',
    units: 1,
    urgency: 'High',
    coordinator: 'Main Admin (Aashay Lead)',
    status: 'Pending',
    createdAt: '2026-11-23'
  }
];
