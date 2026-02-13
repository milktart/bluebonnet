<script>
  import { goto } from '$app/navigation';

  let firstName = '';
  let lastName = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let loading = false;
  let error = '';
  let success = '';

  async function handleRegister(e) {
    e.preventDefault();

    // Validation
    if (!firstName.trim()) {
      error = 'First name is required';
      return;
    }

    if (!lastName.trim() || lastName.length > 1) {
      error = 'Last initial must be a single character';
      return;
    }

    if (!email.trim()) {
      error = 'Email is required';
      return;
    }

    if (!password.trim()) {
      error = 'Password is required';
      return;
    }

    if (password.length < 6) {
      error = 'Password must be at least 6 characters';
      return;
    }

    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    loading = true;
    error = '';
    success = '';

    try {
      // Use relative URL for auth - works with proxies
      const registerUrl = '/auth/register';

      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          confirmPassword
        }),
        credentials: 'include'
      });


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.success) {
        success = 'Account created successfully! Redirecting to login...';
        error = '';
        // Clear form
        firstName = '';
        lastName = '';
        email = '';
        password = '';
        confirmPassword = '';
        // Redirect to login after 1.5 seconds
        setTimeout(() => {
          goto('/login');
        }, 1500);
      } else {
        error = data.message || 'Registration failed';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Registration failed';
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !loading) {
      handleRegister(e);
    }
  }
</script>

<svelte:head>
  <title>Register</title>
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
      <a href="/login" class="navbar-button">
        Log In
      </a>
    </div>
  </div>
</nav>

<main class="register-main">
  <!-- Blurred Background Elements -->
  <div class="background-blur" aria-hidden="true">
    <div class="blur-gradient"></div>
  </div>

  <div class="register-container">
    <div class="register-header">
      <div class="header-icon-container">
        <div class="header-icon">
          <svg class="header-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
        </div>
      </div>

      <div class="header-text">
        <h2 class="header-title">
          Create your account
        </h2>

        <p class="header-subtitle">
          Join Travel Planner and start organizing your adventures
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
      <form on:submit={handleRegister} class="register-form">
        <!-- Name Fields Row -->
        <div class="form-name-row">
          <!-- First Name Field -->
          <div class="form-group">
            <label for="firstName" class="form-label">
              First name
            </label>
            <div class="form-input-wrapper">
              <input
                id="firstName"
                name="firstName"
                type="text"
                autocomplete="given-name"
                required
                bind:value={firstName}
                on:keypress={handleKeyPress}
                class="form-input"
                placeholder="John"
              >
            </div>
          </div>

          <!-- Last Initial Field -->
          <div class="form-group">
            <label for="lastName" class="form-label">
              Last initial
            </label>
            <div class="form-input-wrapper">
              <input
                id="lastName"
                name="lastName"
                type="text"
                autocomplete="family-name"
                required
                maxlength="1"
                bind:value={lastName}
                on:keypress={handleKeyPress}
                class="form-input"
                placeholder="D"
              >
            </div>
          </div>
        </div>

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
              placeholder="john@example.com"
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
              autocomplete="new-password"
              required
              minlength="6"
              bind:value={password}
              on:keypress={handleKeyPress}
              class="form-input"
              placeholder="Enter your password"
            >
          </div>
          <p class="password-hint">Must be at least 6 characters long.</p>
        </div>

        <!-- Confirm Password Field -->
        <div class="form-group">
          <label for="confirmPassword" class="form-label">
            Confirm password
          </label>
          <div class="form-input-wrapper">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              bind:value={confirmPassword}
              on:keypress={handleKeyPress}
              class="form-input"
              placeholder="Confirm your password"
            >
          </div>
        </div>

        <!-- Submit Button -->
        <div class="form-button-wrapper">
          <button
            type="submit"
            disabled={loading}
            class="submit-button"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>

      <!-- Login Link -->
      <div class="form-divider-section">
        <div class="form-divider">
          <div class="divider-line"></div>
          <div class="divider-text">Already have an account?</div>
        </div>
        <div class="form-login-link">
          <a href="/login" class="login-button">
            Sign in to your account
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
    text-decoration: none;
    cursor: pointer;
  }

  .navbar-button:hover {
    background: var(--color-primary-hover);
  }

  /* Main Layout */
  .register-main {
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

  .register-container {
    width: 100%;
    max-width: 28rem;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }

  /* Header Section */
  .register-header {
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

  .register-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  /* Form Name Row */
  .form-name-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }

  @media (min-width: 640px) {
    .form-name-row {
      grid-template-columns: 1fr 1fr;
    }
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

  .password-hint {
    margin-top: var(--spacing-sm);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
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

  /* Login Link */
  .form-login-link {
    margin-top: var(--spacing-2xl);
  }

  .login-button {
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

  .login-button:hover {
    background: var(--color-bg-secondary);
  }

  .login-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
</style>
