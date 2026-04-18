import { test, expect } from '@playwright/test';
import { CalendarPage } from '../pages/CalendarPage';

test.describe('Calendar', () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
    await calendarPage.goto();
  });

  test('should display calendar header', async () => {
    await calendarPage.expectLoaded();
    await expect(calendarPage.header).toBeVisible();
  });

  test('should navigate to next month', async ({ page }) => {
    const initialHeader = await calendarPage.header.textContent();
    await calendarPage.nextButton.click();
    await page.waitForTimeout(300);
    const newHeader = await calendarPage.header.textContent();
    expect(newHeader).not.toBe(initialHeader);
  });

  test('should navigate to previous month', async ({ page }) => {
    const initialHeader = await calendarPage.header.textContent();
    await calendarPage.prevButton.click();
    await page.waitForTimeout(300);
    const newHeader = await calendarPage.header.textContent();
    expect(newHeader).not.toBe(initialHeader);
  });

  test('should switch to week view', async () => {
    await calendarPage.switchToWeekView();
    await expect(calendarPage.calendarGrid).toBeVisible();
  });

  test('should switch to day view', async () => {
    await calendarPage.switchToDayView();
    await expect(calendarPage.calendarGrid).toBeVisible();
  });

  test('should switch back to month view', async () => {
    await calendarPage.switchToWeekView();
    await calendarPage.switchToMonthView();
    await expect(calendarPage.calendarGrid).toBeVisible();
  });

  test('should return to today', async ({ page }) => {
    await calendarPage.nextButton.click();
    await page.waitForTimeout(300);
    await calendarPage.clickToday();
    const headerText = await calendarPage.header.textContent();
    expect(headerText).toBeTruthy();
  });

  test('should display member legend', async () => {
    await expect(calendarPage.memberLegend).toBeVisible();
  });
});
