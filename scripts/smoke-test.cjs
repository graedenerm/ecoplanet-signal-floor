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

  await page.click("#openCreateBtn");
  const open1 = await page.locator("#marketDialog").evaluate((el) => el.open);
  await page.click("[data-close-dialog=marketDialog].ghost");
  const cancelClosed = await page.locator("#marketDialog").evaluate((el) => !el.open);

  await page.click("#openCreateBtn");
  await page.click("[data-close-dialog=marketDialog].icon-button");
  const xClosed = await page.locator("#marketDialog").evaluate((el) => !el.open);

  await page.click("#openCreateBtn");
  await page.keyboard.press("Escape");
  const escClosed = await page.locator("#marketDialog").evaluate((el) => !el.open);

  await page.click("#openCreateBtn");
  await page.fill("#marketTitleInput", "Will this confetti test launch before dinner?");
  await page.fill(
    "#marketCriteriaInput",
    "YES if this browser test creates a market and launches visible celebration particles."
  );
  await page.click("#saveMarketBtn");
  await page.waitForTimeout(100);
  const launchClosed = await page.locator("#marketDialog").evaluate((el) => !el.open);
  const particles = await page.locator(".celebration-particle").count();

  await page.mouse.move(200, 1);
  await page.mouse.move(200, -20);
  await page.waitForTimeout(100);
  const sadParticles = await page.locator(".celebration-particle.emoji").count();

  await browser.close();

  const result = { open1, cancelClosed, xClosed, escClosed, launchClosed, particles, sadParticles };
  console.log(JSON.stringify(result, null, 2));

  if (!open1 || !cancelClosed || !xClosed || !escClosed || !launchClosed || particles < 120 || sadParticles < 30) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
