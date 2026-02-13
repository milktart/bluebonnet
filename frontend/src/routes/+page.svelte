<script>
</script>

<svelte:head>
  <title>Travel Planner</title>
</svelte:head>

<!-- Navigation Bar -->
<nav class="nav">
  <div class="nav-container">
    <div class="nav-content">
      <div class="nav-logo">
        <div class="logo-icon">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </div>
        <span class="logo-text">Travel Planner</span>
      </div>
      <a href="/login" class="nav-button">
        Log In
      </a>
    </div>
  </div>
</nav>

<main class="main">
  <!-- Hero Section -->
  <div class="hero">
    <div class="hero-bg hero-bg-top" aria-hidden="true">
      <div class="hero-gradient"></div>
    </div>

    <div class="hero-container">
      <div class="hero-content">
        <div class="hero-logo">
          <div class="hero-logo-icon">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </div>
        </div>

        <h1 class="hero-title">
          Your Next Adventure
          <span class="hero-title-accent">Starts Here</span>
        </h1>

        <p class="hero-description">
          Plan and organize all your travel experiences in one beautiful place. From flights to accommodations, from itineraries to memories.
        </p>

        <div class="hero-actions">
          <a href="/login" class="btn-primary">
            Start Planning
          </a>
          <a href="#features" class="btn-secondary">
            Learn more <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>

    <div class="hero-bg hero-bg-bottom" aria-hidden="true">
      <div class="hero-gradient-bottom"></div>
    </div>
  </div>

  <!-- Features Section -->
  <div id="features" class="features">
    <div class="features-container">
      <div class="features-header">
        <h2 class="features-subtitle">Everything you need</h2>
        <p class="features-title">
          Better travel planning tools
        </p>
        <p class="features-description">
          Comprehensive features designed to make your travel planning effortless and enjoyable.
        </p>
      </div>

      <div class="features-grid">
        <!-- Feature 1 -->
        <div class="feature">
          <dt class="feature-header">
            <div class="feature-icon">
              <svg class="icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5m-18 0h18" />
              </svg>
            </div>
            Organized Planning
          </dt>
          <dd class="feature-content">
            <p>Keep all your travel details organized with intuitive calendar and list views. Never lose track of your bookings again.</p>
          </dd>
        </div>

        <!-- Feature 2 -->
        <div class="feature">
          <dt class="feature-header">
            <div class="feature-icon">
              <svg class="icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.158.69-.158 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </div>
            Visual Itinerary
          </dt>
          <dd class="feature-content">
            <p>Visualize your entire journey on interactive maps. See your route, destinations, and points of interest at a glance.</p>
          </dd>
        </div>

        <!-- Feature 3 -->
        <div class="feature">
          <dt class="feature-header">
            <div class="feature-icon">
              <svg class="icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </div>
            Flight Integration
          </dt>
          <dd class="feature-content">
            <p>Automatically fetch flight details by simply entering your flight number. Real-time updates and comprehensive information.</p>
          </dd>
        </div>
      </div>
    </div>
  </div>

  <!-- Additional Features Section -->
  <div class="details">
    <div class="details-container">
      <div class="details-grid">
        <div class="details-text">
          <div class="details-text-inner">
            <h2 class="details-subtitle">Comprehensive planning</h2>
            <p class="details-title">Everything in one place</p>
            <p class="details-description">
              From booking management to travel companions, we've got all aspects of your journey covered.
            </p>
            <dl class="details-list">
              <div class="detail-item">
                <dt class="detail-title">
                  <svg class="detail-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                  </svg>
                  Hotels & Accommodations.
                </dt>
                <dd class="detail-description">Track all your bookings, check-in dates, and accommodation details.</dd>
              </div>
              <div class="detail-item">
                <dt class="detail-title">
                  <svg class="detail-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                  </svg>
                  Transportation & Rentals.
                </dt>
                <dd class="detail-description">Manage car rentals, local transportation, and transfer details seamlessly.</dd>
              </div>
              <div class="detail-item">
                <dt class="detail-title">
                  <svg class="detail-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                  </svg>
                  Travel Companions.
                </dt>
                <dd class="detail-description">Collaborate with friends and family, share itineraries, and manage group travel.</dd>
              </div>
            </dl>
          </div>
        </div>
        <div class="details-visual">
          <div class="mockup">
            <div class="mockup-header">
              <div class="mockup-dots">
                <div class="dot dot-red"></div>
                <div class="dot dot-yellow"></div>
                <div class="dot dot-green"></div>
              </div>
            </div>
            <div class="mockup-content">
              <div class="mockup-title">
                <h3>Travel Dashboard</h3>
                <p>Upcoming Trip: Tokyo Adventure</p>
              </div>
              <div class="mockup-items">
                <div class="mockup-item">
                  <span>Flight to Tokyo</span>
                  <span class="badge badge-success">Confirmed</span>
                </div>
                <div class="mockup-item">
                  <span>Hotel Reservation</span>
                  <span class="badge badge-primary">Booked</span>
                </div>
                <div class="mockup-item">
                  <span>City Tour</span>
                  <span class="badge badge-warning">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</main>

<!-- Footer -->
<footer class="footer">
  <div class="footer-container">
    <div class="footer-content">
      <div class="footer-logo">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>
      </div>
      <span class="footer-text">© 2025 Travel Planner. Plan your perfect journey.</span>
    </div>
  </div>
</footer>

<style>
  /* Navigation */
  .nav {
    background: transparent;
    position: relative;
    z-index: 50;
  }

  .nav-container {
    max-width: 80rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  @media (min-width: 640px) {
    .nav-container {
      padding: 0 1.5rem;
    }
  }

  @media (min-width: 1024px) {
    .nav-container {
      padding: 0 2rem;
    }
  }

  .nav-content {
    display: flex;
    height: 4rem;
    align-items: center;
    justify-content: space-between;
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .logo-icon {
    width: 1.5rem;
    height: 1.5rem;
    background: var(--color-primary);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-icon .icon {
    width: 0.75rem;
    height: 0.75rem;
    color: white;
  }

  .logo-text {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .nav-button {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    background: var(--color-primary);
    font-size: var(--text-sm);
    font-weight: 600;
    color: white;
    text-decoration: none;
    transition: background-color 0.2s;
  }

  .nav-button:hover {
    background: var(--color-primary-hover);
  }

  /* Main */
  .main {
    width: 100%;
  }

  /* Hero Section */
  .hero {
    position: relative;
    isolation: isolate;
    padding: 3.5rem 1.5rem;
  }

  @media (min-width: 1024px) {
    .hero {
      padding: 3.5rem 2rem;
    }
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    z-index: -10;
    transform: translateZ(0);
    overflow: hidden;
    filter: blur(80px);
  }

  .hero-bg-top {
    top: -10rem;
  }

  @media (min-width: 640px) {
    .hero-bg-top {
      top: -20rem;
    }
  }

  .hero-gradient {
    position: relative;
    left: calc(50% - 11rem);
    aspect-ratio: 1155/678;
    width: 36.125rem;
    transform: translateX(-50%) rotate(30deg);
    background: linear-gradient(to top right, var(--color-primary-light), var(--color-primary));
    opacity: 0.3;
  }

  @media (min-width: 640px) {
    .hero-gradient {
      left: calc(50% - 30rem);
      width: 72.1875rem;
    }
  }

  .hero-bg-bottom {
    top: calc(100% - 13rem);
  }

  @media (min-width: 640px) {
    .hero-bg-bottom {
      top: calc(100% - 30rem);
    }
  }

  .hero-gradient-bottom {
    position: relative;
    left: calc(50% + 3rem);
    aspect-ratio: 1155/678;
    width: 36.125rem;
    transform: translateX(-50%);
    background: linear-gradient(to top right, var(--color-primary-light), var(--color-primary));
    opacity: 0.3;
  }

  @media (min-width: 640px) {
    .hero-gradient-bottom {
      left: calc(50% + 36rem);
      width: 72.1875rem;
    }
  }

  .hero-container {
    max-width: 42rem;
    margin: 0 auto;
    padding: 8rem 0;
  }

  @media (min-width: 640px) {
    .hero-container {
      padding: 12rem 0;
    }
  }

  @media (min-width: 1024px) {
    .hero-container {
      padding: 14rem 0;
    }
  }

  .hero-content {
    text-align: center;
  }

  .hero-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .hero-logo-icon {
    width: 4rem;
    height: 4rem;
    background: var(--color-primary);
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
  }

  .hero-logo-icon .icon {
    width: 2rem;
    height: 2rem;
    color: white;
  }

  .hero-title {
    font-size: 2.25rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--color-text-primary);
    line-height: 1.1;
  }

  @media (min-width: 640px) {
    .hero-title {
      font-size: 3.75rem;
    }
  }

  .hero-title-accent {
    color: var(--color-primary);
  }

  .hero-description {
    margin-top: 1.5rem;
    font-size: var(--text-lg);
    line-height: 2rem;
    color: var(--color-text-secondary);
    max-width: 36rem;
    margin-left: auto;
    margin-right: auto;
  }

  .hero-actions {
    margin-top: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
  }

  .btn-primary {
    border-radius: var(--radius-md);
    background: var(--color-primary);
    padding: 0.75rem 1.5rem;
    font-size: var(--text-sm);
    font-weight: 600;
    color: white;
    text-decoration: none;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s;
  }

  .btn-primary:hover {
    background: var(--color-primary-hover);
  }

  .btn-primary:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .btn-secondary {
    font-size: var(--text-sm);
    font-weight: 600;
    line-height: 1.5rem;
    color: var(--color-text-primary);
    text-decoration: none;
    transition: color 0.2s;
  }

  .btn-secondary:hover {
    color: var(--color-primary);
  }

  /* Features Section */
  .features {
    padding: 6rem 0;
    background: var(--color-bg-secondary);
  }

  @media (min-width: 640px) {
    .features {
      padding: 8rem 0;
    }
  }

  .features-container {
    max-width: 80rem;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  @media (min-width: 1024px) {
    .features-container {
      padding: 0 2rem;
    }
  }

  .features-header {
    max-width: 42rem;
    margin: 0 auto;
    text-align: center;
  }

  .features-subtitle {
    font-size: var(--text-base);
    font-weight: 600;
    line-height: 1.75rem;
    color: var(--color-primary);
  }

  .features-title {
    margin-top: 0.5rem;
    font-size: 1.875rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--color-text-primary);
  }

  @media (min-width: 640px) {
    .features-title {
      font-size: 2.25rem;
    }
  }

  .features-description {
    margin-top: 1.5rem;
    font-size: var(--text-lg);
    line-height: 2rem;
    color: var(--color-text-secondary);
  }

  .features-grid {
    max-width: 42rem;
    margin: 4rem auto 0;
    display: grid;
    grid-template-columns: 1fr;
    gap: 4rem;
  }

  @media (min-width: 640px) {
    .features-grid {
      margin-top: 5rem;
    }
  }

  @media (min-width: 1024px) {
    .features-grid {
      margin-top: 6rem;
      max-width: none;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }
  }

  .feature {
    display: flex;
    flex-direction: column;
  }

  .feature-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: var(--text-base);
    font-weight: 600;
    line-height: 1.75rem;
    color: var(--color-text-primary);
  }

  .feature-icon {
    height: 2.5rem;
    width: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-lg);
    background: var(--color-primary);
  }

  .feature-icon .icon {
    height: 1.5rem;
    width: 1.5rem;
    color: white;
  }

  .feature-content {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    font-size: var(--text-base);
    line-height: 1.75rem;
    color: var(--color-text-secondary);
  }

  .feature-content p {
    margin: 0;
  }

  /* Details Section */
  .details {
    padding: 6rem 0;
  }

  @media (min-width: 640px) {
    .details {
      padding: 8rem 0;
    }
  }

  .details-container {
    max-width: 80rem;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  @media (min-width: 1024px) {
    .details-container {
      padding: 0 2rem;
    }
  }

  .details-grid {
    max-width: 42rem;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: 4rem;
  }

  @media (min-width: 640px) {
    .details-grid {
      gap: 5rem;
    }
  }

  @media (min-width: 1024px) {
    .details-grid {
      max-width: none;
      margin: 0;
      grid-template-columns: repeat(2, 1fr);
      align-items: center;
    }
  }

  .details-text {
    padding-right: 0;
    padding-top: 0;
  }

  @media (min-width: 1024px) {
    .details-text {
      padding-right: 2rem;
      padding-top: 1rem;
    }
  }

  .details-text-inner {
    max-width: none;
  }

  @media (min-width: 1024px) {
    .details-text-inner {
      max-width: 32rem;
    }
  }

  .details-subtitle {
    font-size: var(--text-base);
    font-weight: 600;
    line-height: 1.75rem;
    color: var(--color-primary);
  }

  .details-title {
    margin-top: 0.5rem;
    font-size: 1.875rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--color-text-primary);
  }

  @media (min-width: 640px) {
    .details-title {
      font-size: 2.25rem;
    }
  }

  .details-description {
    margin-top: 1.5rem;
    font-size: var(--text-lg);
    line-height: 2rem;
    color: var(--color-text-secondary);
  }

  .details-list {
    margin-top: 2.5rem;
    max-width: 36rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    font-size: var(--text-base);
    line-height: 1.75rem;
    color: var(--color-text-secondary);
  }

  @media (min-width: 1024px) {
    .details-list {
      max-width: none;
    }
  }

  .detail-item {
    position: relative;
    padding-left: 2.25rem;
  }

  .detail-title {
    display: inline;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .detail-icon {
    position: absolute;
    left: 0.25rem;
    top: 0.25rem;
    height: 1.25rem;
    width: 1.25rem;
    color: var(--color-primary);
  }

  .detail-description {
    display: inline;
  }

  /* Mockup Visual */
  .details-visual {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    width: 100%;
  }

  @media (min-width: 1024px) {
    .details-visual {
      order: -1;
    }
  }

  .mockup {
    width: 100%;
    border-radius: var(--radius-xl);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: var(--shadow-lg);
    border: 1px solid rgba(156, 163, 175, 0.1);
  }

  .mockup-header {
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    background: rgba(17, 24, 39, 0.05);
    padding: 0.5rem;
  }

  .mockup-dots {
    display: flex;
    gap: 0.25rem;
  }

  .dot {
    height: 0.5rem;
    width: 0.5rem;
    border-radius: 9999px;
  }

  .dot-red {
    background: var(--color-error);
  }

  .dot-yellow {
    background: var(--color-warning);
  }

  .dot-green {
    background: var(--color-success);
  }

  .mockup-content {
    padding: 2rem;
    color: white;
  }

  .mockup-title {
    margin-bottom: 1rem;
  }

  .mockup-title h3 {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
  }

  .mockup-title p {
    margin: 0.25rem 0 0;
    font-size: var(--text-sm);
    opacity: 0.8;
  }

  .mockup-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .mockup-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
  }

  .mockup-item > span:first-child {
    font-size: var(--text-sm);
  }

  .badge {
    font-size: var(--text-xs);
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
  }

  .badge-success {
    background: var(--color-success);
  }

  .badge-primary {
    background: var(--color-primary);
  }

  .badge-warning {
    background: var(--color-warning);
  }

  /* Footer */
  .footer {
    background: var(--color-bg-primary);
    border-top: 1px solid var(--color-border-light);
  }

  .footer-container {
    max-width: 80rem;
    margin: 0 auto;
    padding: 3rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (min-width: 640px) {
    .footer-container {
      justify-content: space-between;
    }
  }

  @media (min-width: 1024px) {
    .footer-container {
      padding: 3rem 2rem;
    }
  }

  .footer-content {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
  }

  @media (min-width: 640px) {
    .footer-content {
      order: 2;
    }
  }

  .footer-logo {
    width: 1.5rem;
    height: 1.5rem;
    background: var(--color-primary);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .footer-logo .icon {
    width: 0.75rem;
    height: 0.75rem;
    color: white;
  }

  .footer-text {
    font-size: var(--text-sm);
    line-height: 1.5rem;
    color: var(--color-text-secondary);
  }
</style>
