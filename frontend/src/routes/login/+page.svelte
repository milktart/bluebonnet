<script>
  import { goto } from '$app/navigation';
  import { authStoreActions } from '$lib/stores/authStore';

  let email = '';
  let password = '';
  let loading = false;
  let error = '';
  let success = '';

  async function handleLogin() {
    if (!email.trim()) {
      error = 'Email is required';
      return;
    }

    if (!password.trim()) {
      error = 'Password is required';
      return;
    }

    loading = true;
    error = '';
    success = '';

    try {
      // Use relative URL for auth - works with proxies
      const loginUrl = '/auth/login';

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();
      if (data.success) {
        // Use the user data from login response to populate auth store
        if (data.user) {
          authStoreActions.login(data.user, '');
        }
        success = 'Login successful, redirecting...';
        setTimeout(() => {
          goto('/dashboard');
        }, 500);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Login failed';
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  }
</script>

<svelte:head>
  <title>Login</title>
</svelte:head>

<!-- Navigation Bar -->
<nav class="navbar">
  <div class="navbar-container">
    <div class="navbar-content">
      <div class="navbar-brand">
        <div class="logo-icon">
          <svg class="logo-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </div>
        <span class="logo-text">Travel Planner</span>
      </div>
      <a href="/" class="navbar-button">
        Back Home
      </a>
    </div>
  </div>
</nav>

<main class="login-main">
  <!-- Blurred Background Elements -->
  <div class="background-blur" aria-hidden="true">
    <div class="blur-gradient"></div>
  </div>

  <div class="login-container">
    <div class="login-header">
      <div class="header-icon-container">
        <div class="header-icon">
          <svg class="header-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </div>
      </div>

      <div class="header-text">
        <h2 class="header-title">
          Welcome to Travel Planner
        </h2>

        <p class="header-subtitle">
          Sign in to your account to continue
        </p>
      </div>
    </div>

    {#if error}
      <div class="alert alert-error">
        <div class="alert-content">
          <svg class="alert-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    {/if}

    {#if success}
      <div class="alert alert-success">
        <div class="alert-content">
          <svg class="alert-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>{success}</span>
        </div>
      </div>
    {/if}

    <div class="form-card">
      <form on:submit={handleLogin} class="login-form">
        <!-- Email Field -->
        <div class="form-group">
          <label for="email" class="form-label">
            Email address
          </label>
          <div class="form-input-wrapper">
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              bind:value={email}
              on:keypress={handleKeyPress}
              class="form-input"
              placeholder="Enter your email"
            >
          </div>
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label for="password" class="form-label">
            Password
          </label>
          <div class="form-input-wrapper">
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              bind:value={password}
              on:keypress={handleKeyPress}
              class="form-input"
              placeholder="Enter your password"
            >
          </div>
        </div>

        <!-- Submit Button -->
        <div class="form-button-wrapper">
          <button
            type="button"
            on:click={handleLogin}
            disabled={loading}
            class="submit-button"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>

      <!-- Register Link -->
      <div class="form-divider-section">
        <div class="form-divider">
          <div class="divider-line"></div>
          <div class="divider-text">Don't have an account?</div>
        </div>
        <div class="form-register-link">
          <a href="/register" class="register-button">
            Create an account
          </a>
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  /* Navigation Styles */
  .navbar {
    background: transparent;
    position: relative;
    z-index: var(--z-nav);
  }

  .navbar-container {
    margin: 0 auto;
    max-width: 80rem;
    padding: var(--spacing-md);
  }

  .navbar-content {
    display: flex;
    height: 4rem;
    align-items: center;
    justify-content: space-between;
  }

  .navbar-brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .logo-icon {
    width: 1.5rem;
    height: 1.5rem;
    background: var(--color-primary);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-svg {
    width: 0.75rem;
    height: 0.75rem;
    color: white;
  }

  .logo-text {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .navbar-button {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    background: var(--color-primary);
    font-size: var(--text-sm);
    font-weight: 600;
    color: white;
    transition: background-color var(--transition-fast);
  }

  .navbar-button:hover {
    background: var(--color-primary-hover);
  }

  /* Main Layout */
  .login-main {
    position: relative;
    isolation: isolate;
    padding: var(--spacing-md) var(--spacing-lg);
    min-height: calc(100vh - 4rem);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .background-blur {
    position: absolute;
    inset-inline: 0;
    top: -10rem;
    z-index: -10;
    overflow: hidden;
    filter: blur(60px);
  }

  .blur-gradient {
    position: relative;
    left: calc(50% - 11rem);
    aspect-ratio: 1155 / 678;
    width: 36.125rem;
    transform: translateX(-50%) rotate(30deg);
    background: linear-gradient(to top right, #bfdbfe, #93c5fd);
    opacity: 0.3;
  }

  @media (min-width: 640px) {
    .blur-gradient {
      left: calc(50% - 30rem);
      width: 72.1875rem;
      top: -20rem;
    }
  }

  .login-container {
    width: 100%;
    max-width: 28rem;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }

  /* Header Section */
  .login-header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    text-align: center;
  }

  .header-icon-container {
    display: flex;
    justify-content: center;
  }

  .header-icon {
    width: 3rem;
    height: 3rem;
    background: var(--color-primary);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-icon-svg {
    width: 1.5rem;
    height: 1.5rem;
    color: white;
  }

  .header-text {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .header-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--color-text-primary);
  }

  .header-subtitle {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin-top: var(--spacing-sm);
  }

  /* Alert Styles */
  .alert {
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    border-radius: var(--radius-lg);
    border: 1px solid;
    font-size: var(--text-sm);
  }

  .alert-error {
    background: var(--color-error-bg);
    color: var(--color-error-text);
    border-color: var(--color-error-light);
  }

  .alert-success {
    background: var(--color-success-bg);
    color: var(--color-success-text);
    border-color: var(--color-success-light);
  }

  .alert-content {
    display: flex;
    gap: var(--spacing-sm);
  }

  .alert-icon {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  .alert-error .alert-icon {
    color: var(--color-error-light);
  }

  .alert-success .alert-icon {
    color: var(--color-success-light);
  }

  /* Form Card */
  .form-card {
    background: var(--color-bg-primary);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    border: 1px solid rgba(17, 24, 39, 0.05);
    padding: 1.5rem 2rem 1.75rem;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  /* Form Group */
  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-label {
    display: block;
    font-size: var(--text-sm);
    font-weight: 500;
    line-height: 1.5;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .form-input-wrapper {
    margin-top: var(--spacing-sm);
  }

  .form-input {
    width: 100%;
    border-radius: var(--radius-md);
    border: none;
    padding: 0.375rem 0.75rem;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-border);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  .form-input::placeholder {
    color: var(--color-text-tertiary);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Submit Button */
  .form-button-wrapper {
    margin-top: var(--spacing-sm);
  }

  .submit-button {
    width: 100%;
    display: flex;
    justify-content: center;
    border-radius: var(--radius-md);
    background: var(--color-primary);
    padding: 0.375rem 0.75rem;
    font-size: var(--text-sm);
    font-weight: 600;
    line-height: 1.5;
    color: white;
    box-shadow: var(--shadow-sm);
    border: none;
    transition: background-color var(--transition-fast);
    cursor: pointer;
  }

  .submit-button:hover {
    background: var(--color-primary-hover);
  }

  .submit-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .submit-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Form Divider */
  .form-divider-section {
    margin-top: var(--spacing-2xl);
  }

  .form-divider {
    position: relative;
    margin-bottom: var(--spacing-2xl);
  }

  .divider-line {
    position: absolute;
    inset-inline: 0;
    top: 50%;
    border-top: 1px solid var(--color-border);
  }

  .divider-text {
    position: relative;
    display: flex;
    justify-content: center;
    font-size: var(--text-sm);
    background: white;
    padding: 0 var(--spacing-sm);
    color: var(--color-text-secondary);
  }

  /* Register Link */
  .form-register-link {
    margin-top: var(--spacing-2xl);
  }

  .register-button {
    display: flex;
    width: 100%;
    justify-content: center;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: white;
    padding: 0.375rem 0.75rem;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
    box-shadow: var(--shadow-sm);
    transition: background-color var(--transition-fast);
    text-decoration: none;
    cursor: pointer;
  }

  .register-button:hover {
    background: var(--color-bg-secondary);
  }

  .register-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
</style>
