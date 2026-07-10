import { expect, test } from '@playwright/test';

test.describe('Auth page', () => {
  test('shows the login experience at /login', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

    const loginForm = page.locator('form').filter({ has: page.getByRole('button', { name: 'Sign In' }) });
    await expect(loginForm.getByPlaceholder('Enter your username')).toBeVisible();
    await expect(loginForm.getByPlaceholder('••••••••••••')).toBeVisible();
  });

  test('shows the register experience at /register', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

    const registerForm = page.locator('form').filter({ has: page.getByRole('button', { name: 'Create Account' }) });
    await expect(registerForm.getByPlaceholder('Enter username')).toBeVisible();
    await expect(registerForm.getByPlaceholder('Enter email address')).toBeVisible();
    await expect(registerForm.locator('#reg-confirm')).toBeVisible();
  });
});