export function getEligibilityInfo(lastDonationDate, lastDonationType) {
  if (!lastDonationDate) {
    return { available: true, eligibleDate: null, daysRemaining: 0 };
  }
  const last = new Date(lastDonationDate);
  if (isNaN(last.getTime())) {
    return { available: true, eligibleDate: null, daysRemaining: 0 };
  }
  const cooldownDays = lastDonationType === 'SDP' ? 14 : 90;
  const eligible = new Date(last);
  eligible.setDate(eligible.getDate() + cooldownDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eligible.setHours(0, 0, 0, 0);

  const diffMs = eligible - today;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    available: daysRemaining <= 0,
    eligibleDate: eligible.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    daysRemaining: Math.max(0, daysRemaining)
  };
}

export function formatWhatsAppNumber(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return '91' + digits;
  return digits;
}

export function generateSOSMessage(c) {
  return `🚨 *URGENT BLOOD REQUIREMENT — Aashay Team JCERC Foundation* 🚨\n\n` +
    `🩸 *Blood Group:* ${c.bloodGroup}\n` +
    `🏥 *Hospital:* ${c.hospital}\n` +
    `👤 *Patient Name:* ${c.patientName}\n` +
    `📦 *Units Required:* ${c.units}\n` +
    `⚠️ *Urgency:* ${c.urgency}\n` +
    `📞 *Coordinator:* ${c.coordinator}\n\n` +
    `If you or someone you know can donate, please reach out immediately. Your one step can save a life! ❤️`;
}
