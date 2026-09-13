const db = require('../config/db');
const { Octokit } = require('@octokit/rest');

class MetricsService {
  /**
   * Process incoming live webhooks from GitHub Actions
   */
  async processWorkflowRun(payload) {
    const { workflow_run, repository } = payload;
    const repoName = repository.full_name;
    const buildId = workflow_run.run_number;
    const rawStatus = workflow_run.conclusion ? workflow_run.conclusion.toUpperCase() : 'UNKNOWN';

    // Calculate execution duration in seconds
    const createdAt = new Date(workflow_run.created_at).getTime();
    const updatedAt = new Date(workflow_run.updated_at).getTime();
    const durationSeconds = Math.max(0, Math.round((updatedAt - createdAt) / 1000));

    // Fetch 30-day historical window
    const statsQuery = `
      SELECT 
        COUNT(*) AS total_runs,
        COUNT(*) FILTER (WHERE status = 'SUCCESS') AS successful_runs,
        COUNT(*) FILTER (WHERE status IN ('FAILURE', 'CANCELLED', 'TIMED_OUT')) AS failed_runs
      FROM pipeline_metrics
      WHERE repo_name = $1 AND created_at >= NOW() - INTERVAL '30 days';
    `;
    const { rows } = await db.query(statsQuery, [repoName]);
    const { total_runs, successful_runs, failed_runs } = rows[0];

    const totalBuilds = parseInt(total_runs, 10) + 1;
    const isCurrentSuccess = rawStatus === 'SUCCESS' ? 1 : 0;
    const isCurrentFailed = ['FAILURE', 'CANCELLED', 'TIMED_OUT'].includes(rawStatus) ? 1 : 0;

    const buildSuccessRate = parseFloat(
      (((parseInt(successful_runs, 10) + isCurrentSuccess) / totalBuilds) * 100).toFixed(2)
    );

    const pipelineStability = parseFloat(
      (100 - (((parseInt(failed_runs, 10) + isCurrentFailed) / totalBuilds) * 100)).toFixed(2)
    );

    const testPassRate = rawStatus === 'SUCCESS' ? 100.0 : 0.0;
    const codeCoverage = 80.0;

    const insertQuery = `
      INSERT INTO pipeline_metrics (
        repo_name, build_id, status, build_success_rate,
        test_pass_rate, code_coverage, pipeline_stability, duration_seconds
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at;
    `;

    const values = [
      repoName,
      buildId,
      rawStatus,
      buildSuccessRate,
      testPassRate,
      codeCoverage,
      pipelineStability,
      durationSeconds,
    ];

    const result = await db.query(insertQuery, values);
    return {
      recordId: result.rows[0].id,
      repoName,
      buildId,
      buildSuccessRate,
      pipelineStability,
      timestamp: result.rows[0].created_at,
    };
  }

  /**
   * Fetch repo metrics directly from GitHub REST API when sync button is pressed
   */
  async fetchRepoMetrics(accessToken, owner, repo) {
    const octokit = new Octokit({ auth: accessToken });
    const repoFullName = `${owner}/${repo}`;

    try {
      // 1. Fetch Repository Details
      const { data: repoData } = await octokit.rest.repos.get({ owner, repo });

      // 2. Fetch Workflow Runs via GitHub REST API
      const { data: runsData } = await octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: 30,
      });

      const totalRuns = runsData.total_count;

      if (totalRuns === 0) {
        // Handle Repositories WITHOUT ci.yml
        const openIssues = repoData.open_issues_count;
        const issueHealth = Math.max(0, 100 - openIssues * 3);

        return {
          name: repoData.name,
          full_name: repoFullName,
          description: repoData.description,
          openIssues,
          openPRs: repoData.open_issues_count,
          pipelineStability: 0,
          healthScore: issueHealth,
          hasCI: false,
        };
      }

      // Handle Repositories WITH ci.yml (or manual workflow runs)
      const runs = runsData.workflow_runs;
      const completedRuns = runs.filter((r) => r.status === 'completed');
      const successfulRuns = completedRuns.filter((r) => r.conclusion === 'success').length;
      const failedRuns = completedRuns.filter((r) =>
        ['failure', 'cancelled', 'timed_out'].includes(r.conclusion)
      ).length;

      const pipelineStability = completedRuns.length > 0
        ? parseFloat(((successfulRuns / completedRuns.length) * 100).toFixed(2))
        : 0;

      const issueHealth = Math.max(0, 100 - repoData.open_issues_count * 3);
      const healthScore = Math.round(pipelineStability * 0.6 + issueHealth * 0.4);

      return {
        name: repoData.name,
        full_name: repoFullName,
        description: repoData.description,
        openIssues: repoData.open_issues_count,
        openPRs: repoData.open_issues_count,
        pipelineStability,
        healthScore,
        hasCI: true,
      };
    } catch (err) {
      console.error(`Failed to fetch metrics for ${repoFullName}:`, err.message);
      return {
        name: repo,
        full_name: repoFullName,
        description: 'Failed to load repository metrics',
        openIssues: 0,
        openPRs: 0,
        pipelineStability: 0,
        healthScore: 0,
        hasCI: false,
      };
    }
  }
}

module.exports = new MetricsService();