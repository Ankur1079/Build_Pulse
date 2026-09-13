import LogoBadge from '../common/LogoBadge';
import { styles } from '../../styles/dashboardStyles';

export default function Header({ user, logout }) {
  return (
    <header style={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <LogoBadge />
        <div>
          <h1 style={styles.title}>BuildPulse</h1>
          <p style={styles.subtitle}>Engineering Health Dashboard</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={styles.userInfo}>
          {user?.avatar_url && <img src={user.avatar_url} alt="Avatar" style={styles.avatar} />}
          <span style={styles.username}>{user?.username}</span>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Sign Out</button>
      </div>
    </header>
  );
}