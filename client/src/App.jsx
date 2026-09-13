import { useState, useEffect, useMemo, useEffectEvent } from 'react';
import Header from './components/layout/Header';
import LoginView from './components/layout/LoginView';
import Toolbar from './components/dashboard/Toolbar';
import MetricChart from './components/dashboard/MetricChart';
import RepoCard from './components/dashboard/RepoCard';
import { styles } from './styles/dashboardStyles';

const API_BASE_URL = 'http://localhost:4000/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(
    new URLSearchParams(window.location.search).get('token') || localStorage.getItem('token')
  ));
  const [syncing, setSyncing] = useState(false);
  const [token, setToken] = useState(() => {
    const tokenFromUrl = new URLSearchParams(window.location.search).get('token');

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      return tokenFromUrl;
    }

    return localStorage.getItem('token');
  });

  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [minHealth, setMinHealth] = useState(0);
  const [sortBy, setSortBy] = useState('healthScore-desc');

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('token')) {
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Fetch User Error:', err);
    }
  };

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/repos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRepos(data);
      }
    } catch (err) {
      console.error('Fetch Repos Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/repos/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        await fetchRepos();
      } else {
        alert(data.error || 'Failed to sync repositories');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setRepos([]);
  };

  const loadDashboardData = useEffectEvent(() => {
    fetchUserData();
    fetchRepos();
  });

  useEffect(() => {
    if (token) {
      const loadTimeout = setTimeout(loadDashboardData, 0);

      return () => clearTimeout(loadTimeout);
    }
  }, [token]);

  // Process Repositories with Filtering and Sorting
  const filteredAndSortedRepos = useMemo(() => {
    return repos
      .filter((repo) => {
        const matchesName = repo.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesHealth = repo.healthScore >= minHealth;
        return matchesName && matchesHealth;
      })
      .sort((a, b) => {
        const [field, direction] = sortBy.split('-');
        const factor = direction === 'asc' ? 1 : -1;
        return ((a[field] ?? 0) - (b[field] ?? 0)) * factor;
      });
  }, [repos, searchQuery, minHealth, sortBy]);

  // Dynamic Chart Data mapping
  const chartData = filteredAndSortedRepos.map((repo) => ({
    name: repo.name.length > 12 ? `${repo.name.substring(0, 12)}...` : repo.name,
    'Health Score': repo.healthScore ?? 0,
    'CI Stability': repo.pipelineStability ?? 0,
    'Test Pass Rate': repo.testPassRate ?? 0,
  }));

  if (!token) {
    return <LoginView />;
  }

  return (
    <div style={styles.pageBackground}>
      <div style={styles.container}>
        <Header user={user} logout={logout} />

        <Toolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          minHealth={minHealth}
          setMinHealth={setMinHealth}
          sortBy={sortBy}
          setSortBy={setSortBy}
          handleSync={handleSync}
          syncing={syncing}
          loading={loading}
        />

        {loading ? (
          <div style={styles.stateCard}>
            <p style={{ color: '#94a3b8' }}>Loading repository metrics...</p>
          </div>
        ) : repos.length === 0 ? (
          <div style={styles.stateCard}>
            <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc' }}>No Repositories Synchronized</h3>
            <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Sync your account to fetch your GitHub repositories and Codecov stats.</p>
            <button onClick={handleSync} style={styles.syncBtn}>Sync Now</button>
          </div>
        ) : (
          <>
            <MetricChart chartData={chartData} repoCount={filteredAndSortedRepos.length} />

            <div style={styles.grid}>
              {filteredAndSortedRepos.map((repo) => (
                <RepoCard key={repo.id || repo.github_repo_id} repo={repo} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}