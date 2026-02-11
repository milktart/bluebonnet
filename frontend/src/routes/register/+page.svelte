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
<nav class="bg-transparent relative z-50">
  <div class="mx-auto max-w-7xl px-4 desktop:px-6 lg:px-8">
    <div class="flex h-16 items-center justify-between">
      <div class="flex items-center space-x-2">
        <div class="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </div>
        <span class="text-lg font-semibold text-gray-900">Travel Planner</span>
      </div>
      <a href="/login" class="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500 transition-colors duration-200">
        Log In
      </a>
    </div>
  </div>
</nav>

<main class="relative isolate px-6 lg:px-8 min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center">
  <!-- Blurred Background Elements -->
  <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl desktop:-top-80" aria-hidden="true">
    <div class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-200 to-blue-400 opacity-30 desktop:left-[calc(50%-30rem)] desktop:w-[72.1875rem]" style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"></div>
  </div>

  <div class="w-full sm:max-w-md space-y-6">
    <div class="text-center space-y-3">
      <div class="flex justify-center">
        <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
        </div>
      </div>

      <div>
        <h2 class="text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>

        <p class="text-center text-sm text-gray-600 mt-2">
          Join Travel Planner and start organizing your adventures
        </p>
      </div>
    </div>

    <div>
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

    <div class="bg-white px-4 shadow-xl ring-1 ring-gray-900/5 sm:rounded-xl" style="padding: 1.5rem 2rem 1.75rem;">
      <form on:submit={handleRegister} class="space-y-4">
        <!-- Name Fields Row -->
        <div class="grid grid-cols-1 gap-4 desktop:grid-cols-2">
          <!-- First Name Field -->
          <div>
            <label for="firstName" class="block text-sm font-medium leading-6 text-gray-900">
              First name
            </label>
            <div class="mt-2">
              <input
                id="firstName"
                name="firstName"
                type="text"
                autocomplete="given-name"
                required
                bind:value={firstName}
                on:keypress={handleKeyPress}
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 desktop:text-sm desktop:leading-6 px-3"
                placeholder="John"
              >
            </div>
          </div>

          <!-- Last Initial Field -->
          <div>
            <label for="lastName" class="block text-sm font-medium leading-6 text-gray-900">
              Last initial
            </label>
            <div class="mt-2">
              <input
                id="lastName"
                name="lastName"
                type="text"
                autocomplete="family-name"
                required
                maxlength="1"
                bind:value={lastName}
                on:keypress={handleKeyPress}
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 desktop:text-sm desktop:leading-6 px-3"
                placeholder="D"
              >
            </div>
          </div>
        </div>

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
              class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 desktop:text-sm desktop:leading-6 px-3"
              placeholder="john@example.com"
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
              autocomplete="new-password"
              required
              minlength="6"
              bind:value={password}
              on:keypress={handleKeyPress}
              class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 desktop:text-sm desktop:leading-6 px-3"
              placeholder="Enter your password"
            >
          </div>
          <p class="mt-2 text-sm text-gray-500">Must be at least 6 characters long.</p>
        </div>

        <!-- Confirm Password Field -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium leading-6 text-gray-900">
            Confirm password
          </label>
          <div class="mt-2">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              bind:value={confirmPassword}
              on:keypress={handleKeyPress}
              class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 desktop:text-sm desktop:leading-6 px-3"
              placeholder="Confirm your password"
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>

      <!-- Login Link -->
      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-white px-2 text-gray-500">Already have an account?</span>
          </div>
        </div>
        <div class="mt-6">
          <a
            href="/login"
            class="flex w-full justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors duration-200"
          >
            Sign in to your account
          </a>
        </div>
      </div>
    </div>
  </div>
</main>
