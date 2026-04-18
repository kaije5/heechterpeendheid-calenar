import { Page, Locator, expect } from '@playwright/test';

export class CalendarPage {
  readonly page: Page;
  readonly header: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly todayButton: Locator;
  readonly addButton: Locator;
  readonly monthViewButton: Locator;
  readonly weekViewButton: Locator;
  readonly dayViewButton: Locator;
  readonly calendarGrid: Locator;
  readonly memberLegend: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('h1');
    this.prevButton = page.locator('button:has([class*="ChevronLeft"])');
    this.nextButton = page.locator('button:has([class*="ChevronRight"])');
    this.todayButton = page.locator('button:has-text("Today")');
    this.addButton = page.locator('button:has([class*="Plus"])');
    this.monthViewButton = page.locator('button:has-text("month")');
    this.weekViewButton = page.locator('button:has-text("week")');
    this.dayViewButton = page.locator('button:has-text("day")');
    this.calendarGrid = page.locator('.calendar-grid');
    this.memberLegend = page.locator('[class*="flex flex-wrap"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded() {
    await expect(this.header).toBeVisible();
    await expect(this.calendarGrid).toBeVisible();
  }

  async clickDay(dayNumber: number) {
    const dayCell = this.page.locator('.calendar-day').filter({ hasText: String(dayNumber) }).first();
    await dayCell.click();
  }

  async switchToMonthView() {
    await this.monthViewButton.click();
    await this.page.waitForTimeout(100);
  }

  async switchToWeekView() {
    await this.weekViewButton.click();
    await this.page.waitForTimeout(100);
  }

  async switchToDayView() {
    await this.dayViewButton.click();
    await this.page.waitForTimeout(100);
  }

  async clickToday() {
    await this.todayButton.click();
    await this.page.waitForTimeout(100);
  }

  async getVisibleEvents() {
    return this.page.locator('.event-chip').count();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `playwright-report/${name}.png` });
  }
}
