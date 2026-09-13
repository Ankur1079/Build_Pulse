const express = require('express');
const router = express.Router();
const { Octokit } = require('@octokit/rest');
const axios = require('axios');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/**
 * Helper: Fetch exact coverage percentage from Codecov API v2
 */
async function fetchCodecovCoverage(owner, repoName) {
  try {
    const response = await axios.get(
      `https://api.codecov.io/api/v2/github/${owner}/repos/${repoName}/`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CODECOV_API_TOKEN}`,
          Accept: 'application/json',
        },
        timeout: 3000,
      }
    );

    const coverage = response.data?.totals?.coverage;
    return coverage !== undefined && coverage !== null ? Math.round(coverage) : null;
  } catch (error) {
    return null;
  }
}

router.post('/sync', async (req, res) => {
  try {
    const userResult = await db.query('SELECT access_token FROM users WHERE id = $1', [req.user.id]);
    const accessToken = userResult.rows[0]?.access_token;

    if (!accessToken) {
      return res.status(401).json({ error: 'GitHub access token missing' });
    }

    const octokit = new Octokit({ auth: accessToken });

    // 1. Fetch authenticated user's repositories
    const { data: ghRepos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 30,
    });

    for (const repo of ghRepos) {
      const owner = repo.owner.login;
      const repoName = repo.name;

      // 2. Fetch REAL-TIME GitHub Actions Workflow Runs
      let pipelineStability = null;
      let testPassRate = null;
      let hasCI = false;

      try {
        const { data: workflowData } = await octokit.rest.actions.listWorkflowRunsForRepo({
          owner,
          repo: repoName,
          per_page: 15,
        });

        if (workflowData.total_count > 0 && workflowData.workflow_runs.length > 0) {
          hasCI = true;
          const successfulRuns = workflowData.workflow_runs.filter(r => r.conclusion === 'success').length;
          pipelineStability = Math.round((successfulRuns / workflowData.workflow_runs.length) * 100);
          testPassRate = pipelineStability;
        } else {
          // Repo has no workflow runs
          hasCI = false;
          pipelineStability = null;
          testPassRate = null;
        }
      } catch (e) {
        // Actions disabled or no permission
        hasCI = false;
        pipelineStability = null;
        testPassRate = null;
      }

      // 3. Fetch REAL-TIME Open Pull Requests
      let openPRsCount = 0;
      try {
        const { data: prs } = await octokit.rest.pulls.list({
          owner,
          repo: repoName,
          state: 'open',
        });
        openPRsCount = prs.length;
      } catch (e) {
        openPRsCount = 0;
      }

      // 4. Fetch Code Coverage
      const realCoverage = await fetchCodecovCoverage(owner, repoName);
      const rawIssuesCount = repo.open_issues_count || 0;
      const actualOpenIssues = Math.max(0, rawIssuesCount - openPRsCount);
      const codeCoverage = realCoverage; // null if not on Codecov

      // Penalties & Health Score Calculation
      const issuePenalty = Math.min(actualOpenIssues * 5, 35);
      const prPenalty = Math.min(openPRsCount * 4, 20);
      const missingDescPenalty = repo.description ? 0 : 10;

      let healthScore = 50; // Default neutral score

      if (hasCI) {
        // Compute score with real CI metrics
        const baseScore = Math.round(
          (pipelineStability * 0.45) +
          (testPassRate * 0.35) +
          ((codeCoverage || 70) * 0.20)
        );
        healthScore = Math.max(10, Math.min(100, baseScore - issuePenalty - prPenalty - missingDescPenalty));
      } else {
        // Non-CI score evaluated based on issues, PRs, and repo metadata
        healthScore = Math.max(10, Math.min(100, 80 - issuePenalty - prPenalty - missingDescPenalty));
      }

      // 5. Upsert Real Data into PostgreSQL
      const upsertQuery = `
        INSERT INTO repositories 
          (user_id, github_repo_id, name, description, open_issues, open_prs, health_score, pipeline_stability, code_coverage, test_pass_rate, has_ci)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (github_repo_id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          open_issues = EXCLUDED.open_issues,
          open_prs = EXCLUDED.open_prs,
          health_score = EXCLUDED.health_score,
          pipeline_stability = EXCLUDED.pipeline_stability,
          code_coverage = EXCLUDED.code_coverage,
          test_pass_rate = EXCLUDED.test_pass_rate,
          has_ci = EXCLUDED.has_ci;
      `;

      await db.query(upsertQuery, [
        req.user.id,
        repo.id,
        repoName,
        repo.description || 'No description provided',
        actualOpenIssues,
        openPRsCount,
        healthScore,
        pipelineStability,
        codeCoverage,
        testPassRate,
        hasCI,
      ]);
    }

    res.json({ message: `Successfully synced ${ghRepos.length} repositories with real-time GitHub & Codecov metrics!` });
  } catch (err) {
    console.error('Realtime Sync Error:', err.message);
    res.status(500).json({ error: 'Failed to sync real-time metrics from GitHub API' });
  }
});

// GET /api/repos
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        github_repo_id AS "githubRepoId", 
        name, 
        description,
        health_score AS "healthScore", 
        open_issues AS "openIssues",
        open_prs AS "openPRs",
        pipeline_stability AS "pipelineStability",
        code_coverage AS "codeCoverage",
        test_pass_rate AS "testPassRate",
        has_ci AS "hasCI",
        CASE 
          WHEN has_ci = FALSE THEN 'NO_CI'
          WHEN health_score >= 75 THEN 'HEALTHY'
          WHEN health_score >= 40 THEN 'WARNING'
          ELSE 'CRITICAL'
        END AS "health_status"
      FROM repositories 
      WHERE user_id = $1 
      ORDER BY health_score DESC;
    `;
    const result = await db.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load repositories' });
  }
});

module.exports = router;