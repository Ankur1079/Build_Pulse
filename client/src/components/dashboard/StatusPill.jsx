// src/components/dashboard/StatusPill.jsx
const STATUS_CONFIG = {
  HEALTHY: {
    label: 'Healthy',
    bg: 'rgba(16, 185, 129, 0.1)',
    text: '#10b981',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  WARNING: {
    label: 'Warning',
    bg: 'rgba(245, 158, 11, 0.1)',
    text: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  CRITICAL: {
    label: 'Critical',
    bg: 'rgba(239, 68, 68, 0.1)',
    text: '#ef4444',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  NO_CI: {
    label: 'No CI/CD',
    bg: 'rgba(148, 163, 184, 0.1)',
    text: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.3)',
  },
};

export default function StatusPill({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NO_CI;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.text,
          marginRight: '6px',
        }}
      />
      {config.label}
    </span>
  );
}