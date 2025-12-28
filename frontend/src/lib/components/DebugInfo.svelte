<script>
  import { onMount } from 'svelte';

  let debugInfo = {
    cssLoaded: false,
    tailwindClasses: 0,
    computedStyles: {},
    stylesheets: [],
    pageTitle: ''
  };

  onMount(() => {
    // Check stylesheets
    const styles = document.styleSheets;
    console.log('=== DEBUG INFO ===');
    console.log('Total stylesheets:', styles.length);
    debugInfo.stylesheets = [];

    for (let i = 0; i < styles.length; i++) {
      try {
        const href = styles[i].href || 'inline';
        debugInfo.stylesheets.push(href);
        console.log(`Stylesheet ${i}: ${href}`);
      } catch (e) {
        console.log(`Stylesheet ${i}: (CORS protected)`);
        debugInfo.stylesheets.push('(CORS protected)');
      }
    }

    // Check if Tailwind classes exist
    const allElements = document.querySelectorAll('[class]');
    let tailwindCount = 0;
    allElements.forEach(el => {
      try {
        const className = typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '');
        if (className.includes('bg-') || className.includes('text-') || className.includes('px-')) {
          tailwindCount++;
        }
      } catch (e) {
        // Ignore errors
      }
    });
    debugInfo.tailwindClasses = tailwindCount;
    console.log('Elements with Tailwind classes:', tailwindCount);

    // Check computed styles on body
    const body = document.body;
    const bodyComputed = window.getComputedStyle(body);
    debugInfo.computedStyles = {
      backgroundColor: bodyComputed.backgroundColor,
      color: bodyComputed.color,
      fontFamily: bodyComputed.fontFamily
    };
    console.log('Body styles:', debugInfo.computedStyles);

    // Check if CSS is actually being applied
    const nav = document.querySelector('nav');
    if (nav) {
      const navComputed = window.getComputedStyle(nav);
      console.log('Nav background color:', navComputed.backgroundColor);
      console.log('Nav border:', navComputed.borderBottom);
      debugInfo.computedStyles.navBackground = navComputed.backgroundColor;
      debugInfo.computedStyles.navBorder = navComputed.borderBottom;
    }

    debugInfo.pageTitle = document.title;
    debugInfo.cssLoaded = debugInfo.stylesheets.length > 0;
  });
</script>

<div style="position: fixed; bottom: 10px; right: 10px; background: #222; color: #0f0; padding: 10px; font-family: monospace; font-size: 11px; max-width: 400px; max-height: 300px; overflow-y: auto; z-index: 9999; border: 1px solid #0f0; pointer-events: auto;">
  <div style="margin-bottom: 5px;"><strong>=== DEBUG INFO ===</strong></div>
  <div>Page: {debugInfo.pageTitle}</div>
  <div>Stylesheets: {debugInfo.stylesheets.length}</div>
  <div>Tailwind elements: {debugInfo.tailwindClasses}</div>
  <div style="margin-top: 5px;"><strong>Computed Styles:</strong></div>
  <div>Body BG: {debugInfo.computedStyles.backgroundColor}</div>
  <div>Body Color: {debugInfo.computedStyles.color}</div>
  <div>Nav BG: {debugInfo.computedStyles.navBackground}</div>
  <div>Nav Border: {debugInfo.computedStyles.navBorder}</div>
  <div style="margin-top: 5px;"><strong>Stylesheets:</strong></div>
  {#each debugInfo.stylesheets as sheet, i}
    <div style="font-size: 10px; margin: 2px 0;">
      {i}: {sheet.substring(0, 60)}...
    </div>
  {/each}
</div>
