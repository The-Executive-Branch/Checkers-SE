# American Checkers — CSCI U540 Team Project

A software implementation of American Checkers (English Draughts), built iteratively over the course of CSCI U540 as a team project.

## Overview

This project simulates the American Checkers board game, allowing a user to play against either another user or a computer opponent. The game follows the standard rules of English Draughts, with support for recording and replaying completed games move by move.

## Team

- **Team name:** The Executive Branch
- **Coordinator:** Blake Trott
- **Members:** Donte Littlejohn, Blake Trott, Israel Thompson, Charles Smith

## Features

**Core requirements:**
- Playable via a graphical user interface
- Play against another user or a computer opponent, with rules enforced strictly
- Game recording (date, time, and all moves)
- Replay of a completed game, step by step (forward and backward)

**Optional (extra credit):**
- User account management (registration, login) backed by a SQL or NoSQL database
- Secure password storage (passwords stored encrypted, not in plaintext)

## Architecture

The server is authoritative: it owns and validates all game state, so the client never computes rules itself. The client (Electron + React) sends move attempts over WebSocket and renders whatever board state the server sends back. This keeps both players' boards from ever desyncing, and gives the Sprint 3 computer opponent a natural home; it's just another "player" whose moves the server computes instead of receiving over the socket.

## Tech Stack

| Component | Choice |
|---|---|
| Language | TypeScript |
| Client shell | Electron |
| Client UI | React |
| Server | Node.js + WebSocket (`ws`) |
| Unit test framework | Jest |
| Code coverage tool | Jest (built-in, via `--coverage`) |
| IDE | Visual Studio Code |

## Roadmap

The project is developed across one planning phase and three sprints:

- **Sprint 0 — Setup:** Finalize language, GUI library, IDE, test framework, coverage tool, and coding style. Build a basic GUI prototype (lines, text, buttons).
- **Sprint 1 — Foundations:** Specify all requirements as user stories with acceptance criteria. Implement user registration, login, logout, and visualization of a new game board. (Board logic is kept separate from the GUI.)
- **Sprint 2 — Core Gameplay:** Full gameplay between two logged-in users, plus saving, retrieving, and replaying a game.
- **Sprint 3 — Computer Opponent:** Add a computer opponent that makes a reasonable (not necessarily optimal) attempt at winning.

## Getting Started

**Prerequisites:** [Node.js](https://nodejs.org/) (includes npm)

```bash
# Clone the repo
git clone git@github.com:The-Executive-Branch/Checkers-SE.git
cd Checkers-SE

# Install dependencies (installs for client, server, and shared packages)
npm install

# Run tests across all packages
npm test

# Run tests with coverage
npm test -- --coverage

# Start the server
npm run start --workspace=server

# In a separate terminal, start the Electron client
npm run start --workspace=client
```

## Development Workflow

- Work is tracked in Jira; each work item has a key (e.g., `TEB-12`).
- Branch names, commit messages, and PR titles should include the issue key so GitHub activity links back to the Jira board automatically (e.g., `TEB-12-add-board-render`).
- Board columns update automatically as branches are created, PRs are opened, and PRs are merged.

## Testing

Every user story's acceptance criteria must pass (via automated tests or documented manual testing), and all unit-level tests must pass, before a sprint's work is considered done.

## Course Info

Developed for **CSCI U540 — Software Engineering**, as a semester-long team project.