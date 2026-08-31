const DELAY_BETWEEN_SCROLLS_MS = 1500;
const DELAY_BETWEEN_CLICKS_MS = 1000;
const DELAY_WHEN_ITS_OPENING_DIALOG = 2000;

const SPINNER_SELECTOR = [
  'svg[aria-label="Loading..."]',
  'svg[aria-label="Loading"]',
  '[role="progressbar"]',
  '[data-visualcompletion="loading-state"]',
].join(", ");

const list = {
  followers: [],
  following: [],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clickElement = (element) => {
  if (!element) {
    return false;
  }

  element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  element.click();
  return true;
};

const normalizeLabel = (value) =>
  value?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";

const findControlByLabel = (root, label, { exact = true } = {}) => {
  if (!root) {
    return null;
  }

  const needle = normalizeLabel(label);
  return Array.from(root.querySelectorAll('button, div[role="button"]')).find(
    (control) => {
      const text = normalizeLabel(control.textContent);
      return exact ? text === needle : text.includes(needle);
    },
  );
};

const getCloseButton = () =>
  findControlByLabel(document, "Close", { exact: false });

const getButtonByText = (text) =>
  findControlByLabel(document, text, { exact: false });

const getLinkByText = (text) => {
  const needle = text.trim().toLowerCase();

  const span = Array.from(document.querySelectorAll("a span")).find(
    (element) => element.textContent?.trim().toLowerCase() === needle,
  );

  if (span) {
    return span.closest("a");
  }

  return Array.from(document.querySelectorAll("a")).find((element) => {
    const content = element.textContent
      ?.replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    return content === needle || content?.includes(needle);
  });
};

const getDialog = () => document.querySelector('div[role="dialog"]');

const hasSpinner = (element) =>
  Boolean(element.querySelector(SPINNER_SELECTOR));

const getDialogScrollable = () => {
  const dialog = getDialog();
  if (!dialog) {
    return null;
  }

  return (
    Array.from(dialog.querySelectorAll("div")).find((element) => {
      const { overflowY } = window.getComputedStyle(element);
      return (
        (overflowY === "auto" || overflowY === "scroll") &&
        element.scrollHeight > element.clientHeight
      );
    }) ?? null
  );
};

const scrollUntilNoSpinner = async (element) => {
  if (!element) {
    console.log("No element");
    return false;
  }

  let lastScrollHeight = -1;

  while (true) {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event("scroll"));
    await sleep(DELAY_BETWEEN_SCROLLS_MS);

    const stillLoading = hasSpinner(element);
    const heightChanged = element.scrollHeight !== lastScrollHeight;
    lastScrollHeight = element.scrollHeight;

    if (!stillLoading && !heightChanged) {
      return true;
    }
  }
};

const scrollDialogContainer = async () => {
  let dialog = getDialog();
  for (let i = 0; i < 10 && !dialog; i++) {
    await sleep(DELAY_BETWEEN_SCROLLS_MS);
    dialog = getDialog();
  }

  if (!dialog) {
    return null;
  }

  let scrollable = getDialogScrollable();
  for (let i = 0; i < 10 && !scrollable; i++) {
    const hasUsers = collectUsernames(dialog).length > 0;
    const loading = hasSpinner(dialog);
    if (hasUsers && !loading) {
      break;
    }

    await sleep(DELAY_BETWEEN_SCROLLS_MS);
    dialog = getDialog() ?? dialog;
    scrollable = getDialogScrollable();
  }

  if (scrollable) {
    await scrollUntilNoSpinner(scrollable);
    return scrollable;
  }

  return dialog;
};

const getUsernameFromLink = (link) => {
  try {
    const path = new URL(link.href, window.location.origin).pathname;
    const match = path.match(/^\/@?([A-Za-z0-9._]+)\/?$/);
    if (match) {
      return match[1];
    }
  } catch {
    // invalid href
  }

  const span = Array.from(link.querySelectorAll("span")).find((node) => {
    const text = node.textContent?.trim() ?? "";
    return node.children.length === 0 && /^[A-Za-z0-9._]+$/.test(text);
  });

  return span?.textContent?.trim() ?? "";
};

const collectUsernames = (element) => {
  if (!element) {
    return [];
  }

  const seen = new Set();
  const usernames = [];

  for (const link of element.querySelectorAll("a")) {
    const username = getUsernameFromLink(link);
    if (!username || seen.has(username)) {
      continue;
    }

    seen.add(username);
    usernames.push(username);
  }

  return usernames;
};

const collectFromCurrentDialog = async () => {
  const scrollable = await scrollDialogContainer();
  return collectUsernames(scrollable ?? getDialog());
};

const openDialogAndCollect = async (trigger) => {
  clickElement(trigger);
  return collectFromCurrentDialog();
};

const findDialogTab = (label) => {
  console.log("Finding dialog tab", label);
  const dialog = getDialog();
  if (!dialog) {
    return null;
  }

  const needle = normalizeLabel(label);
  const matchesTab = (element) => {
    const aria = normalizeLabel(element.getAttribute("aria-label"));
    const text = normalizeLabel(element.textContent);
    return (
      aria === needle ||
      aria.startsWith(`${needle} `) ||
      text === needle ||
      text.startsWith(`${needle} `)
    );
  };

  const byAriaLabel = Array.from(dialog.querySelectorAll("[aria-label]")).find(
    matchesTab,
  );
  if (byAriaLabel) {
    return byAriaLabel;
  }

  const tab = Array.from(dialog.querySelectorAll('[role="tab"]')).find(
    matchesTab,
  );
  if (tab) {
    return tab;
  }

  return Array.from(
    dialog.querySelectorAll('button, div[role="button"], a'),
  ).find(matchesTab);
};

const findFollowingButtonForUser = (username) => {
  const root = getDialog() ?? document;
  const needle = username.trim().toLowerCase();
  const link = Array.from(root.querySelectorAll("a")).find(
    (anchor) => getUsernameFromLink(anchor).toLowerCase() === needle,
  );

  if (!link) {
    return null;
  }

  let node = link.parentElement;
  while (node && node !== root) {
    const button = findControlByLabel(node, "Following");
    if (button) {
      const names = new Set(
        Array.from(node.querySelectorAll("a"))
          .map(getUsernameFromLink)
          .filter(Boolean)
          .map((name) => name.toLowerCase()),
      );

      if (names.size === 1 && names.has(needle)) {
        return button;
      }
    }

    node = node.parentElement;
  }

  return null;
};

const unfollow = async (username) => {
  const followingButton = findFollowingButtonForUser(username);
  if (!followingButton) {
    console.log(`Could not find Following button for ${username}`);
    return false;
  }

  followingButton.scrollIntoView({ block: "center", inline: "nearest" });
  if (!clickElement(followingButton)) {
    return false;
  }

  await sleep(DELAY_BETWEEN_CLICKS_MS);

  const confirmButton = findControlByLabel(document, "Unfollow");
  if (confirmButton) {
    clickElement(confirmButton);
    await sleep(DELAY_BETWEEN_CLICKS_MS);
  }

  console.log(`You've just unfollowed ${username}`);
  return true;
};

const getUnfollowers = (followers, following) => {
  const followerSet = new Set(
    followers.map((username) => username.toLowerCase()),
  );

  return following.filter(
    (username) => !followerSet.has(username.toLowerCase()),
  );
};

const unfollowUsers = async (usernames) => {
  for (const username of usernames) {
    await unfollow(username);
    await sleep(DELAY_BETWEEN_CLICKS_MS);
  }
};

const unfollowNonFollowers = async () => {
  const unfollowers = getUnfollowers(list.followers, list.following);
  console.log("Unfollowers:", unfollowers);
  await unfollowUsers(unfollowers);
  console.log("Unfollowers:", unfollowers);
};

const runInstagram = async () => {
  await sleep(DELAY_WHEN_ITS_OPENING_DIALOG);
  const followersButton = getLinkByText("followers");
  const followingButton = getLinkByText("following");

  list.followers.push(...(await openDialogAndCollect(followersButton)));
  console.log("Followers:", list.followers);

  clickElement(getCloseButton());
  await sleep(DELAY_WHEN_ITS_OPENING_DIALOG);

  list.following.push(...(await openDialogAndCollect(followingButton)));
  console.log("Following:", list.following);

  await unfollowNonFollowers();
};

const runThreads = async () => {
  await sleep(DELAY_WHEN_ITS_OPENING_DIALOG);
  const followersButton =
    getButtonByText("followers") ?? getLinkByText("followers");

  list.followers.push(...(await openDialogAndCollect(followersButton)));
  console.log("Followers:", list.followers);

  await sleep(DELAY_WHEN_ITS_OPENING_DIALOG);
  clickElement(findDialogTab("following"));
  await sleep(DELAY_WHEN_ITS_OPENING_DIALOG);

  list.following.push(...(await collectFromCurrentDialog()));
  console.log("Following:", list.following);

  await unfollowNonFollowers();
};

const run = async () => {
  await sleep(DELAY_BETWEEN_SCROLLS_MS);
  const { href } = window.location;

  if (href.includes("instagram.com")) {
    await runInstagram();
  }

  if (href.includes("threads.com") || href.includes("threads.net")) {
    await runThreads();
  }

  console.log("Bye-bye!");
};

run().catch((error) => {
  console.error("Error:", error);
});
