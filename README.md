# Thought Tracker

A premium, responsive web and mobile application designed for tracking daily thoughts, visualizing cognitive velocity, and maintaining consistency streaks.

## Features

- **Responsive Design**: Adapts natively to full-screen desktop screens (with a left-sidebar layout) and mobile screens (with an elegant bottom navigation bar).
- **Daily Intensity Counter**: A satisfying "+" entry log button featuring vertical odometer rolling numbers and GPU-accelerated physics particle effects.
- **Weekly Bento Grid**: Responsive grid tracking the last 7 days with customized spanning layouts and quick check-in milestones.
- **Cognitive Insights**:
  - **Streak Calendar**: Highlights habits with blue droplets and wraps consecutive streaks in orange gradients.
  - **Velocity Chart**: Interactive tooltips and average tracking.
- **Secure Cloud Sync**: Uses a private GitHub Gist as an offline-first database. Syncs seamlessly between laptop and mobile browser local storages without requiring a database backend or authentication servers.

## Tech Stack

- **Core**: React 19, TypeScript
- **Styles & Animations**: Tailwind CSS v4, Motion (Framer Motion)
- **Icons**: Lucide React

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the local development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Cloud Sync Configuration

To synchronize data between multiple devices securely:

1. **Create a GitHub Token**:
   - Go to your GitHub Settings > Developer Settings > Personal Access Tokens > **Tokens (classic)**.
   - Generate a new token with only the `gist` scope checked.

2. **Create a Gist**:
   - Go to [gist.github.com](https://gist.github.com).
   - Create a secret Gist.
   - Name the file `thought-tracker-records.json` and set the content to `{}`.
   - Click "Create secret gist" and copy the 32-character **Gist ID** from the end of the browser URL.

3. **Connect in App**:
   - Open the **Sync Settings** panel in the app, paste your Token and Gist ID (or Gist URL), and click **Save & Sync**.
