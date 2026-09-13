// src/components/dashboard/RepoCard.jsx
import StatusPill from './StatusPill';
import { styles } from '../../styles/dashboardStyles';

export default function RepoCard({ repo }) {
  const isNoCI = repo.hasCI === false || repo.health_status === 'NO_CI';

  // Compute status key for StatusPill
  const statusKey = isNoCI 
    ? 'NO_CI' 
    : repo.health_status || (repo.healthScore >= 75 ? 'HEALTHY' : repo.healthScore >= 40 ? 'WARNING' : 'CRITICAL');

  return (
    <div style={styles.card}>
      <div>
        <div style={styles.cardHeader}>
          <h3 style={styles.repoTitle}>{repo.name || repo.repo_name}</h3>
          <StatusPill status={statusKey} />
        </div>

        <p style={styles.repoDesc}>
          {repo.description || 'No description provided.'}
        </p>

        <div style={styles.metricGrid}>
          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>OPEN ISSUES</span>
            <span style={styles.metricValue}>
              {repo.openIssues ?? repo.open_issues ?? 0}
            </span>
          </div>

          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>OPEN PRS</span>
            <span style={styles.metricValue}>
              {repo.openPRs ?? repo.open_prs ?? 0}
            </span>
          </div>

          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>CI STABILITY</span>
            <span
              style={{
                ...styles.metricValue,
                color: isNoCI ? '#64748b' : '#f8fafc',
              }}
            >
              {isNoCI ? 'N/A' : `${repo.pipelineStability ?? repo.pipeline_stability ?? 0}%`}
            </span>
          </div>

          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>COVERAGE</span>
            <span
              style={{
                ...styles.metricValue,
                color: isNoCI ? '#64748b' : '#f8fafc',
              }}
            >
              {isNoCI ? 'N/A' : `${repo.code_coverage ?? 0}%`}
            </span>
          </div>
        </div>
      </div>

      {isNoCI && (
        <div
          style={{
            marginTop: '16px',
            padding: '10px 12px',
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            border: '1px dashed #334155',
            fontSize: '12px',
            color: '#94a3b8',
            lineHeight: '1.4',
          }}
        >
          ⚠️ Add <code style={{ color: '#6366f1' }}>.github/workflows/ci.yml</code> to enable automated monitoring.
        </div>
      )}
    </div>
  );
}