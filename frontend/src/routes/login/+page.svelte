<script>
  let email = '';
  let password = '';
  let loading = false;
  let error = '';
  let success = '';

  async function handleLogin(e) {
    e.preventDefault();

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
      console.log('[Login DEBUG] Attempting login at:', loginUrl);

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
        success = 'Login successful, redirecting...';
        setTimeout(() => {
          window.location.href = '/dashboard';
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
      handleLogin(e);
    }
  }
</script>

<svelte:head>
  <title>Login</title>
</svelte:head>

<!-- Navigation Bar -->
<nav class="bg-white border-b border-gray-200">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 items-center justify-between">
      <div class="flex items-center space-x-2">
        <div class="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </div>
        <span class="text-lg font-semibold text-gray-900">Travel Planner</span>
      </div>
      <a href="/" class="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500 transition-colors duration-200">
        Back Home
      </a>
    </div>
  </div>
</nav>

<main class="flex flex-col justify-center flex-1 py-6 sm:px-6 lg:px-8" style="margin-top: -10%;">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="flex justify-center">
      <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>
      </div>
    </div>
    <h2 class="mt-4 text-center text-3xl font-bold tracking-tight text-gray-900">
      Welcome to Travel Planner
    </h2>
    <p class="mt-2 text-center text-sm text-gray-600">
      Sign in to your account to continue
    </p>
  </div>

  <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
    {#if error}
      <div class="rounded-lg bg-red-50 p-4 text-sm text-red-700 mb-4 border border-red-200">
        <div class="flex">
          <svg class="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    {/if}

    {#if success}
      <div class="rounded-lg bg-green-50 p-4 text-sm text-green-700 mb-4 border border-green-200">
        <div class="flex">
          <svg class="h-5 w-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>{success}</span>
        </div>
      </div>
    {/if}

    <div class="bg-white py-6 px-4 shadow-xl ring-1 ring-gray-900/5 sm:rounded-xl sm:px-10">
      <form on:submit={handleLogin} class="space-y-6">
        <!-- Email Field -->
        <div>
          <label for="email" class="block text-sm font-medium leading-6 text-gray-900">
            Email address
          </label>
          <div class="mt-2">
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              bind:value={email}
              on:keypress={handleKeyPress}
              class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
              placeholder="Enter your email"
            >
          </div>
        </div>

        <!-- Password Field -->
        <div>
          <label for="password" class="block text-sm font-medium leading-6 text-gray-900">
            Password
          </label>
          <div class="mt-2">
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              bind:value={password}
              on:keypress={handleKeyPress}
              class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
              placeholder="Enter your password"
            >
          </div>
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            disabled={loading}
            class="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  </div>
</main>

<!-- Footer -->
<footer class="bg-white border-t border-gray-200 mt-auto">
  <div class="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
    <div class="flex justify-center space-x-2 md:order-2">
      <div class="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>
      </div>
      <span class="text-sm leading-6 text-gray-500">© 2025 Travel Planner. Plan your perfect journey.</span>
    </div>
  </div>
</footer>
