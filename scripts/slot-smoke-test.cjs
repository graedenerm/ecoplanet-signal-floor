const path = require("path");
const { chromium } = require("playwright");

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const fileUrl = `file:///${path
    .resolve("C:/Users/mgr/OneDrive/Dokumente/New project/index.html")
    .replace(/\\/g, "/")
    .replace(/ /g, "%20")}`;

  await page.goto(fileUrl);
  if (await page.locator("#authDialog").evaluate((el) => el.open).catch(() => false)) {
    await page.click("[data-close-dialog=authDialog].icon-button");
  }
  await page.evaluate(() => {
    state.gamification.lastIdleBonusAt[state.currentUserId] = 0;
    state.gamification.lastIdleBonusReward[state.currentUserId] = 25;
    state.gamification.lastIdleBonusCombo[state.currentUserId] = "🍋❓🍋";
    showIdleBonusDialog();
  });

  const xCount = await page.locator("#idleBonusDialog [aria-label='Close idle bonus dialog']").count();
  const open = await page.locator("#idleBonusDialog").evaluate((el) => el.open);
  const defaults = await Promise.all([
    page.locator("#slotOne").textContent(),
    page.locator("#slotTwo").textContent(),
    page.locator("#slotThree").textContent(),
  ]);
  await page.click("[data-close-dialog=idleBonusDialog].ghost");
  const skipClosed = await page.locator("#idleBonusDialog").evaluate((el) => !el.open);
  await page.evaluate(() => showIdleBonusDialog());
  const opensAgainImmediately = await page.locator("#idleBonusDialog").evaluate((el) => el.open);
  await page.click("[data-close-dialog=idleBonusDialog].ghost");
  const rewards = await page.evaluate(() => Array.from({ length: 20 }, () => drawIdleBonusReward()));
  const canRepeatPreviousPayout = rewards.includes(25);
  const canLose = rewards.includes(0);
  const combo = await page.evaluate(() => finalSlotSymbols(0).join(""));
  const visualComboChanged = combo !== "🍋❓🍋";

  await browser.close();

  const result = { xCount, open, defaults, skipClosed, opensAgainImmediately, rewards, canRepeatPreviousPayout, canLose, combo, visualComboChanged };
  console.log(JSON.stringify(result, null, 2));
  if (
    xCount !== 0 ||
    !open ||
    !defaults.every((value) => value === "❓") ||
    !skipClosed ||
    !opensAgainImmediately ||
    !canRepeatPreviousPayout ||
    !canLose ||
    !visualComboChanged
  ) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
