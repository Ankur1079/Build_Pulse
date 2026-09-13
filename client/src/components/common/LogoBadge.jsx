import logoImg from '../../assets/BuildPulse.svg';
import { styles } from '../../styles/dashboardStyles';

export default function LogoBadge() {
  return (
    <div style={styles.logoBadge}>
      <img src={logoImg} alt="BuildPulse Logo" style={styles.logoImage} />
    </div>
  );
}