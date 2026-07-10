import { expect, test, type Page } from '@playwright/test';

type AuthState = {
  user: {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    is_active: boolean;
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
  mustChangePassword: boolean;
  isAuthenticated: boolean;
};

const setAuthStorage = async (page: Page, state: AuthState) => {
  await page.addInitScript((value) => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: value, version: 0 }));
  }, state);
};

test.describe('Protected routes', () => {
  test('redirects anonymous users from chat to login', async ({ page }) => {
    await page.goto('/chat');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('redirects authenticated non-admin users away from admin routes', async ({ page }) => {
    await setAuthStorage(page, {
      user: {
        id: 'user-1',
        username: 'testuser',
        email: 'test@vqa.com',
        role: 'user',
        is_active: true,
      },
      accessToken: 'access.token.value',
      refreshToken: 'refresh.token.value',
      mustChangePassword: false,
      isAuthenticated: true,
    });

    await page.goto('/admin/users');

    await expect(page).toHaveURL(/\/chat$/);
  });

  test('forces password change before entering protected routes', async ({ page }) => {
    await setAuthStorage(page, {
      user: {
        id: 'user-2',
        username: 'testuser',
        email: 'test@vqa.com',
        role: 'user',
        is_active: true,
      },
      accessToken: 'access.token.value',
      refreshToken: 'refresh.token.value',
      mustChangePassword: true,
      isAuthenticated: true,
    });

    await page.goto('/chat');

    await expect(page).toHaveURL(/\/change-password$/);
    await expect(page.getByText('Password update required')).toBeVisible();
    await expect(page.getByText('Your administrator reset your account. Choose a new password to continue.')).toBeVisible();
  });
});