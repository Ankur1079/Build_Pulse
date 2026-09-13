const metricsService = require('../services/metricsService');

async function handleGitHubWebhook(req, res) {
  const event = req.githubEvent;
  const payload = req.body;

  if (event !== 'workflow_run') {
    return res.status(200).json({ status: 'ignored', reason: `Unhandled event: ${event}` });
  }

  const { action } = payload;
  if (action !== 'completed') {
    return res.status(200).json({ status: 'ignored', reason: `Action incomplete: ${action}` });
  }

  try {
    const result = await metricsService.processWorkflowRun(payload);
    console.log(`[Metric Logged] ${result.repoName} Build #${result.buildId}`);
    return res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    console.error('Error handling webhook payload:', error);
    return res.status(500).json({ error: 'Failed to record metrics' });
  }
}

module.exports = { handleGitHubWebhook };