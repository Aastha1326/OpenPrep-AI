import { describe, test, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import API from './api';

describe('API Service Response Interceptor', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('should not attempt token refresh when /auth/login returns 401', async () => {
    const error401 = {
      config: { url: '/auth/login', headers: {} },
      response: { status: 401, data: { error: 'Invalid credentials' } },
    };

    // Get the response error interceptor function
    const responseErrorInterceptor = API.interceptors.response.handlers[0].rejected;

    const axiosPostSpy = vi.spyOn(axios, 'post');

    await expect(responseErrorInterceptor(error401)).rejects.toEqual(error401);
    expect(axiosPostSpy).not.toHaveBeenCalled();
  });

  test('should not attempt token refresh when /auth/register returns 401', async () => {
    const error401 = {
      config: { url: '/auth/register', headers: {} },
      response: { status: 401, data: { error: 'Unauthorized' } },
    };

    const responseErrorInterceptor = API.interceptors.response.handlers[0].rejected;
    const axiosPostSpy = vi.spyOn(axios, 'post');

    await expect(responseErrorInterceptor(error401)).rejects.toEqual(error401);
    expect(axiosPostSpy).not.toHaveBeenCalled();
  });

  test('should not attempt token refresh when /auth/refresh-token returns 401', async () => {
    const error401 = {
      config: { url: '/auth/refresh-token', headers: {} },
      response: { status: 401, data: { error: 'Invalid refresh token' } },
    };

    const responseErrorInterceptor = API.interceptors.response.handlers[0].rejected;
    const axiosPostSpy = vi.spyOn(axios, 'post');

    await expect(responseErrorInterceptor(error401)).rejects.toEqual(error401);
    expect(axiosPostSpy).not.toHaveBeenCalled();
  });

  test('should not attempt token refresh for non-401 error status', async () => {
    const error500 = {
      config: { url: '/quizzes', headers: {} },
      response: { status: 500, data: { error: 'Server error' } },
    };

    const responseErrorInterceptor = API.interceptors.response.handlers[0].rejected;
    const axiosPostSpy = vi.spyOn(axios, 'post');

    await expect(responseErrorInterceptor(error500)).rejects.toEqual(error500);
    expect(axiosPostSpy).not.toHaveBeenCalled();
  });

  test('should attempt token refresh on 401 for non-auth endpoints if refresh token exists', async () => {
    localStorage.setItem('refreshToken', 'valid-refresh-token');

    const originalRequest = {
      url: '/quizzes',
      headers: {},
    };

    const error401 = {
      config: originalRequest,
      response: { status: 401, data: { error: 'Token expired' } },
    };

    const axiosPostSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { token: 'new-access-token', refreshToken: 'new-refresh-token' },
    });

    // Mock API retry request execution
    const apiSpy = vi.spyOn(API, 'request').mockResolvedValueOnce({ data: ['quiz1'] });

    const responseErrorInterceptor = API.interceptors.response.handlers[0].rejected;
    
    // Executing the interceptor should trigger axios.post to /auth/refresh-token
    try {
      await responseErrorInterceptor(error401);
    } catch {
      // ignore
    }

    expect(axiosPostSpy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh-token'),
      { refreshToken: 'valid-refresh-token' }
    );
    expect(localStorage.getItem('token')).toBe('new-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
    
    axiosPostSpy.mockRestore();
    apiSpy.mockRestore();
  });
});
