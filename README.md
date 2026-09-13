# BuildPulse 🚀

BuildPulse is a real-time developer dashboard and CI/CD monitoring tool that connects with GitHub to track repository health, open issues, pull requests, code coverage, test pass rates, and pipeline stability.

It provides a centralized view of software project health, helping developers identify repository risks and monitor development and CI/CD performance.

## 🌟 Features

- **GitHub OAuth Authentication:** Securely sign in using your GitHub account.
- **GitHub Metric Synchronization:** Fetch repository information, open issues, and pull request counts through the GitHub REST API.
- **Codecov Integration:** Retrieve and synchronize code coverage metrics.
- **Repository Health Score:** Compute a health score based on repository and CI/CD performance metrics.
- **CI/CD Visibility:** Distinguish repositories with active GitHub Actions workflow runs from those without configured CI/CD.
- **Pipeline Stability Tracking:** Monitor pipeline performance and stability metrics.
- **Dynamic Analytics Dashboard:** Visualize repository metrics, health scores, code coverage, and testing performance in one interface.
- **Persistent Data Storage:** Store user and repository metrics in PostgreSQL.

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js, Octokit |
| **Database** | PostgreSQL 18 |
| **Database Client** | `pg` with connection pooling |
| **Authentication** | GitHub OAuth |
| **APIs & Integrations** | GitHub REST API, Codecov |
| **Deployment** | Vercel (Frontend), Render (Backend & Database) |

## 🌐 Live Demo

- **Frontend Dashboard:** [BuildPulse](https://buildpulse-lime.vercel.app/)
- **Backend API:** [BuildPulse API](https://buildpulse-kqzb.onrender.com/)

## 📸 Project Overview

BuildPulse provides developers with a dashboard to monitor:

- Repository health scores
- Open issues and pull requests
- Code coverage
- Test pass rates
- Pipeline stability
- CI/CD configuration status

## ⚙️ Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/BuildPulse.git
cd BuildPulse
```

### 2. Configure Environment Variables

Create a `.env` file inside the `server` directory:

```env
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=buildpulse_db
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
FRONTEND_URL=http://localhost:5173
```

> **Note:** Update the database port and other values according to your local PostgreSQL configuration.

### 3. Database Schema Migration

Connect to your local PostgreSQL instance and create the database:

```sql
CREATE DATABASE buildpulse_db;
```

Then connect to the database:

```sql
\c buildpulse_db
```

Create the required tables:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  github_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  access_token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS repositories (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  github_repo_id BIGINT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  open_issues INT DEFAULT 0,
  open_prs INT DEFAULT 0,
  health_score INT DEFAULT 0,
  pipeline_stability INT,
  code_coverage INT,
  test_pass_rate INT,
  has_ci BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Install Dependencies

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies in a separate terminal:

```bash
cd client
npm install
```

### 5. Run the Application

**Start the backend server:**

```bash
cd server
npm run dev
```

**Start the frontend client:**

```bash
cd client
npm run dev
```

The frontend will typically be available at:

```text
http://localhost:5173
```

## 📁 Project Structure

```text
BuildPulse/
├── client/              # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/              # Express backend
│   ├── routes/
│   ├── controllers/
│   ├── db/
│   ├── index.js
│   └── package.json
│
├── README.md
└── .gitignore
```

> Adjust the structure above if your actual repository uses different folder names.

## 🔐 Security Notes

- Never commit `.env` files or expose GitHub OAuth secrets.
- Store sensitive credentials using environment variables.
- Use secure authentication and session-handling practices in production.
- Avoid exposing GitHub access tokens in API responses or frontend code.

## 🚀 Future Improvements

- Add historical repository health trends.
- Support GitHub Actions workflow history and failure analysis.
- Add automated alerts through Slack or email.
- Introduce repository comparison features.
- Add role-based access control for teams.
- Improve health-score customization and metric weighting.

## 📄 License

This project is available for educational and portfolio purposes. Add a license such as MIT if you intend to distribute it as open source.
