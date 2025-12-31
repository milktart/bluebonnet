<footer class="footer">
  <div class="footer-content">
    <div class="footer-section">
      <h3>Bluebonnet</h3>
      <p>Plan your perfect trip with ease. All your travel details in one place.</p>
    </div>

    <div class="footer-section">
      <h4>Quick Links</h4>
      <ul>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/trips">My Trips</a></li>
        <li><a href="/account">Account</a></li>
      </ul>
    </div>

    <div class="footer-section">
      <h4>Support</h4>
      <ul>
        <li><a href="#help">Help Center</a></li>
        <li><a href="#contact">Contact Us</a></li>
        <li><a href="#privacy">Privacy Policy</a></li>
        <li><a href="#terms">Terms of Service</a></li>
      </ul>
    </div>

    <div class="footer-section">
      <h4>Follow Us</h4>
      <div class="social-links">
        <a href="#twitter" aria-label="Twitter">𝕏</a>
        <a href="#facebook" aria-label="Facebook">f</a>
        <a href="#instagram" aria-label="Instagram">📷</a>
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    <p>&copy; 2024 Bluebonnet Travel Planner. All rights reserved.</p>
  </div>
</footer>

<style>
  .footer {
    background: #2c3e50;
    color: #ecf0f1;
    padding: 3rem 2rem 1rem;
    margin-top: 4rem;
  }

  .footer-content {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .footer-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    color: #fff;
  }

  .footer-section h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #fff;
  }

  .footer-section p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.6;
    color: #bdc3c7;
  }

  .footer-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .footer-section li {
    margin-bottom: 0.5rem;
  }

  .footer-section a {
    color: #bdc3c7;
    text-decoration: none;
    transition: color 0.2s ease;
    cursor: pointer;
  }

  .footer-section a:hover {
    color: #3498db;
  }

  .social-links {
    display: flex;
    gap: 1rem;
  }

  .social-links a {
    font-size: 1.25rem;
  }

  .footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 1rem;
    text-align: center;
    font-size: 0.85rem;
    color: #95a5a6;
  }

  .footer-bottom p {
    margin: 0;
  }

  @media (max-width: 768px) {
    .footer {
      padding: 2rem 1rem 0.5rem;
    }

    .footer-content {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
</style>
