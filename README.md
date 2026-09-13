# BuildPulse 🚀

BuildPulse is a real-time developer dashboard and CI/CD monitoring platform that connects directly with GitHub to aggregate and visualize repository health, open issues, pull requests, code coverage, test pass rates, and pipeline stability.

---

## 🌟 Features

* **GitHub OAuth Authentication:** Secure, seamless sign-in using your GitHub account.
* **Real-Time GitHub & CI Metric Sync:** Fetch and compute live health scores, open issues, open PRs, and active CI/CD statuses (`has_ci`).
* **CI/CD Visibility Pills:** Instantly distinguishes repositories with active workflow runs from those without configured CI/CD.
* **Dynamic Dashboard:** Clean, responsive analytics interface built to track team and project velocity at a glance.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, Lucide Icons
* **Backend:** Node.js, Express.js, Octokit (GitHub REST API)
* **Database:** PostgreSQL (v18) with connection pooling (`pg`)
* **Deployment:** Vercel (Frontend) & Render (Backend API & Managed PostgreSQL)

---

## 🚀 Live Demo

* **Frontend Dashboard:** [https://buildpulse-lime.vercel.app/](https://buildpulse-lime.vercel.app/)
* **Backend API:** [https://buildpulse-kqzb.onrender.com/](https://buildpulse-kqzb.onrender.com/)

---

## ⚙️ Local Development Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/BuildPulse.git](https://github.com/your-username/BuildPulse.git)
cd BuildPulse
