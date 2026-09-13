import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { styles } from '../../styles/dashboardStyles';

export default function MetricChart({ chartData, repoCount }) {
  if (!chartData || chartData.length === 0) return null;

  return (
    <div style={styles.chartCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f8fafc', margin: 0 }}>
          Metric Overview ({repoCount} Repositories)
        </h2>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
          <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
            itemStyle={{ color: '#cbd5e1' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Bar dataKey="Health Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="CI Stability" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Test Pass Rate" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}