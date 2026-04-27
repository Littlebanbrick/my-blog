# Git Basics — Practical Learning Notes

## 1. What is Git?

**Git** is a distributed version control system that tracks changes in files over time.

Core idea:
> Git tracks **files**, not folders, and records **snapshots (commits)** of your project.

---

## 2. Core Concepts

### 2.1 Repository (Repo)
A project managed by Git.

- Local repo → on your computer  
- Remote repo → on GitHub  

---

### 2.2 The `.git` Folder

Created by:

```bash
git init
```

It stores:

- commit history  
- branches  
- configuration  
- remote info  

> Think of `.git` as the “brain” of Git.

---

### 2.3 Working Directory → Staging Area → Repository

Git workflow:

```text
Working Directory → Staging Area → Local Repo → Remote Repo
```

Commands mapping:

| Step | Command |
|------|--------|
| Modify files | (edit files) |
| Stage | `git add` |
| Commit | `git commit` |
| Upload | `git push` |

---

## 3. Starting a Project

### 3.1 Initialize a Repo

```bash
git init
```

Use when:
- You have a local folder and want Git tracking

---

### 3.2 Clone an Existing Repo

```bash
git clone https://github.com/user/repo.git
```

Use when:
- Downloading someone else's project

> Do NOT use `git init` after cloning.

---

## 4. Connecting to Remote (GitHub)

### 4.1 Add Remote

```bash
git remote add origin https://github.com/user/repo.git
```

- `origin` = default remote name

Check:

```bash
git remote -v
```

---

## 5. The Push Workflow (Complete)

### First-time push:

```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Later updates:

```bash
git add .
git commit -m "Update something"
git push
```

---

### 5.1 Why `-u`?

```bash
git push -u origin main
```

It sets **upstream tracking**:

```text
local main ↔ origin/main
```

So future commands can be:

```bash
git push
git pull
```

---

## 6. Common Errors Explained

### 6.1 Not a Git Repository

```text
fatal: not a git repository
```

Reason:
- No `.git` folder

Fix:

```bash
git init
```

---

### 6.2 No Upstream Branch

```text
fatal: The current branch has no upstream branch
```

Fix:

```bash
git push -u origin main
```

---

### 6.3 Push Succeeds but Nothing Changes

Possible causes:

- No commit made
- Wrong branch
- Wrong remote
- Viewing wrong branch on GitHub

---

## 7. File Creation in Bash

### Create empty file

```bash
touch file.txt
```

---

### Write content

```bash
echo "Hello" > file.txt
```

---

### Multi-line content

```bash
cat > file.txt << EOF
line 1
line 2
EOF
```

---

## 8. README, .gitignore, LICENSE

### README.md

- Project description
- Shown on GitHub homepage

---

### .gitignore

Defines files Git should ignore:

```text
*.log
*.db
desktop.ini
```

> Important:  
`.gitignore` does NOT affect already tracked files.

---

### LICENSE

Defines how others can use your code (e.g., MIT License)

---

## 9. Removing Files from Git

### Remove but keep locally

```bash
git rm --cached file
```

---

### Remove completely

```bash
git rm file
```

---

## 10. Fixing Mistaken Uploads (e.g., database)

### Step 1: Ignore it

```bash
echo "*.db" >> .gitignore
```

---

### Step 2: Remove from tracking

```bash
git rm --cached database.db
```

---

### Step 3: Commit & push

```bash
git commit -m "Remove database"
git push
```

---

### If sensitive data leaked

- Rewrite history (`git filter-branch` / `git filter-repo`)
- Change credentials immediately

---

## 11. Why Empty Folders Don’t Appear

Git does NOT track folders.

Solution:

```bash
touch folder/.gitkeep
```

---

## 12. Windows-Specific File: `desktop.ini`

- Created by Windows (not Git)
- Should be ignored

```bash
echo desktop.ini >> .gitignore
git rm --cached desktop.ini
```

---

## 13. Daily Workflow (Recommended)

Every time you open Bash:

```bash
cd your_repo
git status
```

Then:

```bash
git add .
git commit -m "message"
git push
```

---

## 14. Useful Commands Summary

```bash
git status        # check changes
git log           # view history
git branch        # list branches
git remote -v     # check remote
git pull          # get updates
```

---

## 15. Key Principles

- Git tracks **files, not folders**
- `.gitignore` only affects **untracked files**
- `commit` is local, `push` is remote
- First push needs `-u`
- One repo = one `.git` folder

---

## 16. Mental Model (Most Important)

Think of Git as:

```text
A timeline of snapshots
```

Each commit = a checkpoint

You are not “saving files” —  
you are **recording history**.

---

## Final Summary

> Modify → Add → Commit → Push  
> (Repeat this cycle)

Master this loop, and you’ve mastered Git basics.