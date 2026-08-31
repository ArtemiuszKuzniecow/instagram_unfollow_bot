# Unfollow checker

This script finds people **you follow who do not follow you back**, then unfollows them on **Instagram** or **Threads**.

You run it yourself in the browser. It does not log in for you and does not store your password.

## What it does

1. Opens your **Followers** list and loads everyone on it.
2. Opens your **Following** list (Instagram: a new window; Threads: the **Following** tab in the same window).
3. Compares the two lists.
4. Unfollows anyone you follow who is not in your followers.

Each unfollow is logged in the console, for example: `You've just unfollowed username`.

## Before you start

- Use a desktop browser (Chrome, Firefox, or Edge).
- Log in to Instagram or Threads.
- Open **your own profile** (not someone else’s).
- Stay on that tab while the script runs. Do not switch away or close the window.

Unfollowing can take a while if you follow many people. The script waits between actions on purpose so the site is less likely to block you.

## How to run

1. Open your profile:
   - Instagram: `https://www.instagram.com/your_username/`
   - Threads: `https://www.threads.com/@your_username`
2. Open the developer console:
   - Press `F12`, then click the **Console** tab if it is not already selected
   - Windows / Linux: `Ctrl + Shift + J` (Chrome/Edge) or `Ctrl + Shift + K` (Firefox)
   - macOS: `Cmd + Option + J` (Chrome/Edge) or `Cmd + Option + K` (Firefox)
3. If the console asks you to allow pasting, type `allow pasting` and press Enter.
4. Copy the full contents of `src/index.js` and paste them into the console.
5. Press Enter.

The script detects Instagram vs Threads from the page URL. You do not choose a mode.

## What you should see

In the console, in this order:

- `Followers:` — list of people who follow you
- `Following:` — list of people you follow
- `You've just unfollowed …` — one line per person who did not follow back
- `Unfollowers:` — the full list of people who were unfollowed
- `Bye-bye!` — finished

A **Followers** / **Following** dialog will open on the page. That is expected. Leave it alone; the script clicks and scrolls it.

If you have only a few followers, the list may not scroll. The script still collects those names.

## Instagram vs Threads

| | Instagram | Threads |
| --- | --- | --- |
| Start | Your profile | Your profile |
| Followers | Opens the Followers window | Opens the Followers window |
| Following | Closes Followers, then opens Following | Stays in the same window and switches to the **Following** tab |

You do not need to click those lists yourself.

## If something goes wrong

- **Nothing happens** — confirm you are on *your* profile, not the home feed, that you pasted the whole file into the **Console** tab (`F12`), and not into some other DevTools panel.
- **Followers / Following stay empty** — wait for the page to finish loading, then run the script again.
- **`Could not find Following button`** — that person may have been skipped; check the console and the list on the page.
- **The site shows a warning or temporarily blocks actions** — stop and try again later. Do not rerun immediately.

## Please note

This uses Instagram/Threads in a way they may not allow. Your account can be limited or banned. Use it on your own account only, and do not run it over and over in a short time.
