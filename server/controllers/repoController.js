const db = require('../config/db');
const metricsService = require('../services/metricsService');

/**
 * Fetch repository health scores, combining PostgreSQL view data with live GitHub API data
 */
async function getRepoHealthScores(req, res) {
  try {
    // 1. Fetch cached DB metrics from PostgreSQL view
    const dbQuery = `
      SELECT 
        repo_name,
        total_builds,
        build_success_rate,
        test_pass_rate,
        code_coverage,
        pipeline_stability,
        health_score,
        health_status,
        last_updated
      FROM vw_repo_health_score
      ORDER BY health_score DESC;
    `;

    const { rows: dbMetrics } = await db.query(dbQuery);

    // Map DB rows by repo_name for O(1) fast lookup
    const dbMetricsMap = new Map();
    dbMetrics.forEach((metric) => {
      dbMetricsMap.set(metric.repo_name, metric);
    });

    // 2. Fetch all user repos from GitHub API (or req.user.repos if saved in session)
    const userRepos = req.user?.repos || []; // Array of repo objects e.g. [{ name: 'repo-1', owner: 'username' }]
    const accessToken = req.user?.accessToken;

    // 3. Merge DB metrics for CI repos and compute live fallback for non-CI repos
    const repoHealthResults = await Promise.all(
      userRepos.map(async (repo) => {
        const repoFullName = repo.full_name || `${repo.owner}/${repo.name}`;
        
        // If DB already has real webhook metrics for this repo, use them
        if (dbMetricsMap.has(repoFullName)) {
          return {
            ...dbMetricsMap.get(repoFullName),
            hasCI: true,
          };
        }

        // If repo has NO webhook records in DB, fetch live stats via GitHub REST API
        if (accessToken && repo.owner && repo.name) {
          const liveMetrics = await metricsService.fetchRepoMetrics(
            accessToken,
            repo.owner,
            repo.name
          );
          return {
            repo_name: repoFullName,
            total_builds: 0,
            build_success_rate: 0,
            test_pass_rate: 0,
            code_coverage: 0,
            pipeline_stability: liveMetrics.pipelineStability,
            health_score: liveMetrics.healthScore,
            health_status: liveMetrics.hasCI ? 'ACTIVE' : 'NO_CI',
            last_updated: new Date(),
            hasCI: liveMetrics.hasCI,
          };
        }

        // Fallback for repos completely lacking CI configuration
        return {
          repo_name: repoFullName,
          total_builds: 0,
          build_success_rate: 0,
          test_pass_rate: 0,
          code_coverage: 0,
          pipeline_stability: 0,
          health_score: 50, // Default neutral score based on non-CI repo status
          health_status: 'NO_CI',
          last_updated: null,
          hasCI: false,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: repoHealthResults.length,
      data: repoHealthResults,
    });
  } catch (error) {
    console.error('Error querying repository health scores:', error);
    return res.status(500).json({ error: 'Failed to retrieve repository health metrics' });
  }
}

module.exports = { getRepoHealthScores };