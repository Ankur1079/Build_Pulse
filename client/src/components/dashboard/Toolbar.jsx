import { styles } from '../../styles/dashboardStyles';

export default function Toolbar({
  searchQuery,
  setSearchQuery,
  minHealth,
  setMinHealth,
  sortBy,
  setSortBy,
  handleSync,
  syncing,
  loading,
}) {
  return (
    <div style={styles.actionSection}>
      <div style={styles.filterToolbar}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>SEARCH REPOSITORY</label>
          <input
            type="text"
            placeholder="Search by repository name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.filterGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label style={styles.label}>MIN HEALTH SCORE</label>
            <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: '600' }}>{minHealth}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={minHealth}
            onChange={(e) => setMinHealth(Number(e.target.value))}
            style={styles.rangeInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>SORT BY</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.select}
          >
            <option value="healthScore-desc">Health Score (High → Low)</option>
            <option value="healthScore-asc">Health Score (Low → High)</option>
            <option value="openIssues-desc">Open Issues (Most First)</option>
            <option value="openIssues-asc">Open Issues (Least First)</option>
            <option value="pipelineStability-desc">CI Stability (Highest First)</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSync}
        disabled={syncing || loading}
        style={{
          ...styles.syncBtn,
          opacity: syncing || loading ? 0.6 : 1,
          cursor: syncing || loading ? 'not-allowed' : 'pointer',
        }}
      >
        {syncing ? 'Syncing Metrics...' : '↻ Sync GitHub Metrics'}
      </button>
    </div>
  );
}