# SSH vs HTTPS Setup

## Current Status
Remote URL has been updated. You have two options:

## Option 1: Use HTTPS (Easier - Recommended)

The remote is now set to HTTPS. To push:

```bash
git push -u origin main
```

If asked for credentials:
- **Username**: Your GitHub username
- **Password**: Use a Personal Access Token (create at https://github.com/settings/tokens)
  - Select scope: `repo`
  - Copy the token and paste it as the password

## Option 2: Use SSH (If you have SSH keys set up)

If you want to use SSH, you need to:

1. **Check if you have SSH keys:**
   ```bash
   ls -la ~/.ssh/id_*
   ```

2. **If no keys exist, generate one:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Press Enter to accept default location
   # Optionally set a passphrase
   ```

3. **Add SSH key to GitHub:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Copy the output
   ```
   Then go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste the key
   - Save

4. **Add GitHub to known_hosts:**
   ```bash
   ssh-keyscan github.com >> ~/.ssh/known_hosts
   ```

5. **Update remote and push:**
   ```bash
   git remote set-url origin git@github.com:GeminiSupa/misbahdiary.git
   git push -u origin main
   ```

## Quick Push (HTTPS - Easiest)

Since we've switched back to HTTPS, just run:

```bash
git push -u origin main
```

And use your Personal Access Token when prompted for password.

