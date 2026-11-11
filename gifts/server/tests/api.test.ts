import { beforeEach, describe, expect, it } from 'vitest';
import { handleApi } from '../src/httpApi';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../src/catalog';
import { resetStoreForTests } from '../src/store';

async function api(path: string, init?: RequestInit) {
  const response = await handleApi(new Request(`https://gifts.mcwhorezone.com${path}`, init));
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
  };
}

async function loginAdmin() {
  const response = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  expect(response.status).toBe(200);
  return response.body.token as string;
}

describe('Gifts API', () => {
  beforeEach(async () => {
    await resetStoreForTests();
  });

  it('seeds admin books and requires auth for gift lists', async () => {
    const denied = await api('/api/gifts');
    expect(denied.status).toBe(401);

    const token = await loginAdmin();
    const gifts = await api('/api/gifts', {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(gifts.status).toBe(200);
    expect(gifts.body.length).toBe(27);
    expect(gifts.body[0].category).toBe('books');
    expect(gifts.body.some((gift: { title: string }) => gift.title === 'Beyond Good and Evil')).toBe(
      true,
    );
  });

  it('registers pending users and lets admin approve them', async () => {
    const created = await api('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'cousin@example.com',
        displayName: 'Cousin',
        password: 'password123',
      }),
    });
    expect(created.status).toBe(201);
    expect(created.body.user.status).toBe('pending');

    const blocked = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'cousin@example.com', password: 'password123' }),
    });
    expect(blocked.status).toBe(403);

    const adminToken = await loginAdmin();
    const users = await api('/api/admin/users', {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const pending = users.body.find((user: { email: string }) => user.email === 'cousin@example.com');
    expect(pending).toBeTruthy();

    const approved = await api(`/api/admin/users/${pending.id}`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ status: 'approved' }),
    });
    expect(approved.status).toBe(200);
    expect(approved.body.user.status).toBe('approved');

    const memberLogin = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'cousin@example.com', password: 'password123' }),
    });
    expect(memberLogin.status).toBe(200);
  });

  it('lets another member claim a gift and blocks double purchase', async () => {
    await api('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'aunt@example.com',
        displayName: 'Aunt',
        password: 'password123',
      }),
    });
    const adminToken = await loginAdmin();
    const users = await api('/api/admin/users', {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const aunt = users.body.find((user: { email: string }) => user.email === 'aunt@example.com');
    await api(`/api/admin/users/${aunt.id}`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ status: 'approved' }),
    });
    const auntLogin = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'aunt@example.com', password: 'password123' }),
    });
    const auntToken = auntLogin.body.token as string;

    const gifts = await api('/api/gifts?status=open', {
      headers: { authorization: `Bearer ${auntToken}` },
    });
    const giftId = gifts.body[0].id as number;

    const claimed = await api(`/api/gifts/${giftId}/purchase`, {
      method: 'POST',
      headers: { authorization: `Bearer ${auntToken}` },
    });
    expect(claimed.status).toBe(200);
    expect(claimed.body.status).toBe('purchased');
    expect(claimed.body.purchasedByName).toBe('Aunt');

    const second = await api(`/api/gifts/${giftId}/purchase`, {
      method: 'POST',
      headers: { authorization: `Bearer ${auntToken}` },
    });
    expect(second.status).toBe(409);

    await api('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'uncle@example.com',
        displayName: 'Uncle',
        password: 'password123',
      }),
    });
    const afterUsers = await api('/api/admin/users', {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const uncle = afterUsers.body.find((user: { email: string }) => user.email === 'uncle@example.com');
    await api(`/api/admin/users/${uncle.id}`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ status: 'approved' }),
    });
    const uncleLogin = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'uncle@example.com', password: 'password123' }),
    });

    const asOtherMember = await api('/api/gifts', {
      headers: { authorization: `Bearer ${uncleLogin.body.token}` },
    });
    const viewed = asOtherMember.body.find((gift: { id: number }) => gift.id === giftId);
    expect(viewed.status).toBe('purchased');
    expect(viewed.purchasedByName).toBeNull();
  });
});
