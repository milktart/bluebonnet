/**
 * Voucher Sidebar Manager
 * Manages the tertiary sidebar for attaching and creating vouchers
 */

let availableVouchers = [];
let currentFlightId = null;
let currentTripId = null;
let currentFlightDetails = null;

/**
 * Open the voucher attachment panel in the tertiary sidebar
 * @param {string} flightId - The flight ID to attach vouchers to
 * @param {string} tripId - The trip ID (for fetching companions)
 * @param {string} flightDetails - Display text for the flight (not displayed, kept for reference)
 */
async function openVoucherAttachmentPanel(flightId, tripId, flightDetails) {
  // Validate that we have required IDs
  if (!flightId || !tripId) {
    console.error('openVoucherAttachmentPanel - Missing required IDs:', { flightId, tripId });
    alert('Error: Flight or trip ID is missing. Please refresh the page.');
    return;
  }

  // If tertiary sidebar is already open with a different flight, close it first
  if (currentFlightId && currentFlightId !== flightId) {
    closeTertiarySidebar();
  }

  currentFlightId = flightId;
  currentTripId = tripId;
  currentFlightDetails = flightDetails;

  // Fetch available vouchers and companions
  try {
    const [vouchersResponse, companionsResponse] = await Promise.all([
      fetch(`/vouchers/available-for-flight/${flightId}`),
      fetch(`/api/trips/${tripId}/companions`)
    ]);

    const vouchersResult = await vouchersResponse.json();
    const companionsResult = await companionsResponse.json();

    if (vouchersResult.success) {
      availableVouchers = vouchersResult.data;
    }

    // Render the panel
    renderVoucherPanel(companionsResult.success ? companionsResult.data : []);
  } catch (error) {
    console.error('Error loading voucher panel:', error);
    alert('Error loading voucher panel');
  }

  // Open tertiary sidebar
  openTertiarySidebar();
}

/**
 * Render the voucher attachment panel in tertiary sidebar
 */
function renderVoucherPanel(companions) {
  const container = document.getElementById('tertiary-sidebar-content');

  const panelHTML = `
    <div class="flex items-start justify-between mb-6">
      <div class="flex items-center">
        <button onclick="closeTertiarySidebar()" class="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mr-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2 class="text-lg font-bold text-gray-900">Vouchers</h2>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200 flex space-x-4">
      <button
        onclick="switchVoucherTab('attach')"
        class="tab-button py-3 px-4 text-sm font-medium text-gray-700 border-b-2 border-transparent hover:border-gray-300 active-tab"
        data-tab="attach"
      >
        Attach Voucher
      </button>
      <button
        onclick="switchVoucherTab('add')"
        class="tab-button py-3 px-4 text-sm font-medium text-gray-700 border-b-2 border-transparent hover:border-gray-300"
        data-tab="add"
      >
        Add New Voucher
      </button>
    </div>

    <!-- Attach Voucher Tab -->
    <div id="attach-tab" class="voucher-tab active">
      <form id="attachmentForm" onsubmit="submitVoucherAttachment(event)" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Select Voucher *</label>
          <select id="voucherSelect" onchange="onVoucherSelected(event)" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
            <option value="">Select a voucher...</option>
            ${availableVouchers.map(voucher => {
              // Calculate remaining balance properly
              let remaining, remainingDisplay, balanceInfo;

              if (!voucher.totalValue) {
                // Certificate type - no monetary value
                remaining = 'N/A';
                remainingDisplay = 'N/A';
                balanceInfo = '';
              } else {
                // Credit/Card type - calculate remaining
                const usedAmount = voucher.usedAmount || 0;
                remaining = parseFloat(voucher.totalValue) - parseFloat(usedAmount);
                remainingDisplay = remaining.toFixed(2);
                balanceInfo = ` (${voucher.currency} ${remainingDisplay} remaining,`;
              }

              const expirationText = voucher.expirationDate
                ? new Date(voucher.expirationDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})
                : 'No expiration';

              return `<option value="${voucher.id}" data-balance="${remaining}" data-currency="${voucher.currency}" data-type="${voucher.type}">
                ${voucher.issuer} - ${voucher.voucherNumber}${balanceInfo ? balanceInfo + ' expires ' + expirationText + ')' : ' - expires ' + expirationText}
              </option>`;
            }).join('')}
          </select>
        </div>

        <!-- Traveler selection (always visible) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Traveler *</label>
          <select id="travelerId" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
            <option value="">Select traveler...</option>
            <option value="${userId}:USER">You</option>
            ${companions && companions.length > 0 ? `
              <optgroup label="Travel Companions">
                ${companions.map(c => `<option value="${c.id}:COMPANION">${c.name}</option>`).join('')}
              </optgroup>
            ` : ''}
          </select>
        </div>

        <!-- Value field - hidden for certificates -->
        <div id="valueField">
          <label class="block text-sm font-medium text-gray-700 mb-1">Attachment Amount *</label>
          <input type="number" id="attachmentValue" name="attachmentValue" step="0.01" min="0" placeholder="0.00" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          <p class="text-xs text-gray-600 mt-1">Max available: <span id="maxAttachmentValue">—</span></p>
        </div>

        <!-- Certificate type notice -->
        <div id="certificateNotice" class="p-3 bg-purple-50 border border-purple-200 rounded-md text-purple-700 text-sm hidden">
          This certificate type has no monetary value associated with it.
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="attachmentNotes" name="notes" placeholder="e.g., Applied to outbound leg only" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Attach Voucher
          </button>
          <button type="button" onclick="closeTertiarySidebar()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Add New Voucher Tab -->
    <div id="add-tab" class="voucher-tab hidden">
      <form id="newVoucherForm" onsubmit="submitNewVoucher(event)" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Voucher Type *</label>
          <select id="voucherType" onchange="onVoucherTypeChange(event)" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
            <option value="">Select type...</option>
            <option value="TRAVEL_CREDIT">Travel Credit</option>
            <option value="UPGRADE_CERT">Upgrade Certificate</option>
            <option value="COMPANION_CERT">Companion Certificate</option>
            <option value="GIFT_CARD">Gift Card</option>
            <option value="MISC">Miscellaneous</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Issuer *</label>
          <input type="text" id="newIssuer" name="issuer" required placeholder="e.g., United Airlines" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Voucher Number *</label>
          <input type="text" id="newVoucherNumber" name="voucherNumber" required placeholder="e.g., V12345678" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <!-- Value fields - hidden for certificates -->
        <div id="newValueFields">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select id="newCurrency" name="currency" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Total Value</label>
              <input type="number" id="newTotalValue" name="totalValue" step="0.01" min="0" placeholder="0.00" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
          <input type="date" id="newExpirationDate" name="expirationDate" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Associated Account</label>
          <input type="text" id="newAssociatedAccount" name="associatedAccount" placeholder="e.g., Frequent Flyer #" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">PIN Code (if applicable)</label>
          <input type="password" id="newPinCode" name="pinCode" placeholder="Leave blank if not needed" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="newNotes" name="notes" placeholder="Any additional information..." rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <button type="submit" class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            Create Voucher
          </button>
          <button type="button" onclick="closeTertiarySidebar()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `;

  if (container) {
    container.innerHTML = panelHTML;
  }
}

/**
 * Switch between tabs in the voucher panel
 */
function switchVoucherTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.voucher-tab').forEach(tab => {
    tab.classList.add('hidden');
    tab.classList.remove('active');
  });

  // Remove active class from all buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active-tab', 'border-blue-600', 'text-blue-600');
  });

  // Show selected tab
  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.remove('hidden');
    selectedTab.classList.add('active');
  }

  // Set active button
  const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeButton) {
    activeButton.classList.add('active-tab', 'border-blue-600', 'text-blue-600');
  }
}

/**
 * Handle voucher type change in new voucher form
 */
function onVoucherTypeChange(event) {
  const voucherType = event.target.value;
  const valueFields = document.getElementById('newValueFields');
  const certificateTypes = ['UPGRADE_CERT', 'COMPANION_CERT'];

  if (certificateTypes.includes(voucherType)) {
    valueFields.style.display = 'none';
    document.getElementById('newTotalValue').removeAttribute('required');
  } else {
    valueFields.style.display = 'block';
    document.getElementById('newTotalValue').setAttribute('required', 'required');
  }
}

/**
 * Handle voucher selection change in attach form
 */
function onVoucherSelected(event) {
  const selectedValue = event.target.value;
  const voucherType = event.target.options[event.target.selectedIndex]?.dataset.type;
  const valueField = document.getElementById('valueField');
  const certificateNotice = document.getElementById('certificateNotice');
  const certificateTypes = ['UPGRADE_CERT', 'COMPANION_CERT'];

  if (!selectedValue) {
    document.getElementById('maxAttachmentValue').textContent = '—';
    document.getElementById('attachmentValue').max = '';
    document.getElementById('attachmentValue').value = '';
    document.getElementById('attachmentValue').removeAttribute('required');
    valueField.style.display = 'grid';
    certificateNotice.classList.add('hidden');
    return;
  }

  // Show/hide value field based on voucher type
  if (certificateTypes.includes(voucherType)) {
    valueField.style.display = 'none';
    document.getElementById('attachmentValue').removeAttribute('required');
    certificateNotice.classList.remove('hidden');
  } else {
    valueField.style.display = 'block';
    document.getElementById('attachmentValue').setAttribute('required', 'required');
    certificateNotice.classList.add('hidden');

    const selectedOption = event.target.options[event.target.selectedIndex];
    const balance = selectedOption.dataset.balance;
    const currency = selectedOption.dataset.currency;

    document.getElementById('maxAttachmentValue').textContent = `${currency} ${parseFloat(balance).toFixed(2)}`;
    document.getElementById('attachmentValue').max = balance;
    document.getElementById('attachmentValue').value = '';
  }
}

/**
 * Submit voucher attachment
 */
async function submitVoucherAttachment(event) {
  event.preventDefault();

  const voucherId = document.getElementById('voucherSelect').value;
  const travelerValue = document.getElementById('travelerId').value;
  const voucherType = document.getElementById('voucherSelect').options[document.getElementById('voucherSelect').selectedIndex]?.dataset.type;
  const certificateTypes = ['UPGRADE_CERT', 'COMPANION_CERT'];

  // Validate
  if (!voucherId || !travelerValue) {
    alert('Please fill in all required fields');
    return;
  }

  // For non-certificate types, require attachment value
  if (!certificateTypes.includes(voucherType)) {
    const attachmentValue = document.getElementById('attachmentValue').value;
    if (!attachmentValue) {
      alert('Please specify an attachment amount');
      return;
    }
  }

  const attachmentValue = document.getElementById('attachmentValue').value || null;
  const notes = document.getElementById('attachmentNotes').value;
  const [travelerId, travelerType] = travelerValue.split(':');

  const payload = {
    voucherId,
    travelerId,
    travelerType,
    attachmentValue: attachmentValue ? parseFloat(attachmentValue) : null,
    notes
  };

  try {
    const response = await fetch(`/vouchers/flights/${currentFlightId}/attach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      // Store flightId BEFORE closing the tertiary sidebar (which resets currentFlightId to null)
      const flightIdToRefresh = currentFlightId;

      closeTertiarySidebar();

      // Refresh the secondary sidebar with updated flight form
      refreshFlightAttachments(flightIdToRefresh);
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    console.error('Error attaching voucher:', error);
    alert('Error attaching voucher');
  }
}

/**
 * Submit new voucher creation
 */
async function submitNewVoucher(event) {
  event.preventDefault();

  const voucherType = document.getElementById('voucherType').value;
  const issuer = document.getElementById('newIssuer').value;
  const voucherNumber = document.getElementById('newVoucherNumber').value;
  const certificateTypes = ['UPGRADE_CERT', 'COMPANION_CERT'];
  const ownerBoundTypes = ['TRAVEL_CREDIT', 'COMPANION_CERT', 'GIFT_CARD'];

  let totalValue = null;
  if (!certificateTypes.includes(voucherType)) {
    totalValue = document.getElementById('newTotalValue').value;
    if (!totalValue) {
      alert('Total value is required for this voucher type');
      return;
    }
  }

  // Note: userId is defined in trip.ejs line 158 as: const userId = '<%- user.id %>';
  // This will be available as a global variable when this function is called

  const payload = {
    type: voucherType,
    issuer,
    voucherNumber,
    currency: document.getElementById('newCurrency').value,
    totalValue: totalValue ? parseFloat(totalValue) : null,
    expirationDate: document.getElementById('newExpirationDate').value || null,
    associatedAccount: document.getElementById('newAssociatedAccount').value || null,
    pinCode: document.getElementById('newPinCode').value || null,
    notes: document.getElementById('newNotes').value || null,
    userId: userId  // userId is a global const defined in trip.ejs
  };

  try {
    const response = await fetch('/vouchers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      alert('Voucher created successfully!');

      // Only refresh if we have a valid currentFlightId (voucher panel is open for a specific flight)
      if (currentFlightId && currentFlightId !== 'null') {
        // Refresh the available vouchers list to include the newly created one
        try {
          const vouchersResponse = await fetch(`/vouchers/available-for-flight/${currentFlightId}`);
          const vouchersResult = await vouchersResponse.json();

          if (vouchersResponse.ok && vouchersResult.success) {
            availableVouchers = vouchersResult.data;

            // Fetch companions data for the panel
            const companionsResponse = await fetch(`/api/trips/${currentTripId}/companions`);
            const companionsResult = companionsResponse.ok ? await companionsResponse.json() : { success: false, data: [] };

            // Re-render the attach tab with updated vouchers and companions
            renderVoucherPanel(companionsResult.success ? companionsResult.data : []);
            // Switch back to attach tab so user can attach the new voucher
            switchVoucherTab('attach');
          } else {
            console.error('Failed to fetch available vouchers:', vouchersResult);
            alert('Error: Could not refresh voucher list. Please try again.');
          }
        } catch (error) {
          console.error('Error refreshing vouchers:', error);
          alert('Error refreshing voucher list. Please close the panel and reopen to see the new voucher.');
        }
      } else {
        // No active flight context - just close the panel and let user reopen to see new voucher
        closeTertiarySidebar();
      }
    } else {
      alert('Error creating voucher: ' + result.message);
    }
  } catch (error) {
    console.error('Error creating voucher:', error);
    alert('Error creating voucher');
  }
}

/**
 * Refresh flight attachments in secondary sidebar asynchronously
 * Reloads the flight form to display updated voucher attachments
 */
async function refreshFlightAttachments(flightId) {
  // Validate flightId before attempting to fetch
  if (!flightId || flightId === 'null' || flightId === 'undefined') {
    console.error('Invalid flightId for refresh:', flightId);
    alert('Error: Invalid flight ID. Please reload the page.');
    return;
  }

  try {
    // Fetch the updated flight form
    // The getEditForm endpoint fetches the flight with its trip relationship
    const response = await fetch(`/flights/${flightId}/form`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Update the secondary sidebar with the new form
    const container = document.getElementById('secondary-sidebar-content');

    if (container) {
      container.innerHTML = html;

      // Execute any scripts in the loaded content
      const scripts = container.querySelectorAll('script');
      scripts.forEach(script => {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        document.head.appendChild(newScript);
      });

      // Call form initialization functions if they exist
      if (typeof initializeFlightForm === 'function') {
        initializeFlightForm();
      }
      if (typeof setupAsyncFormSubmission === 'function') {
        setupAsyncFormSubmission('editFlightForm');
      }
      if (typeof initFlightDateTimePickers === 'function') {
        initFlightDateTimePickers();
      }
      if (typeof initAirportSearch === 'function') {
        initAirportSearch();
      }
    } else {
      console.error('Could not find secondary-sidebar-content container');
    }
  } catch (error) {
    console.error('Error refreshing flight attachments:', error);
    alert('Error refreshing flight information. Please try reloading the page.');
  }
}

/**
 * Open tertiary sidebar
 */
function openTertiarySidebar() {
  const sidebar = document.getElementById('tertiary-sidebar');
  if (sidebar) {
    sidebar.classList.add('open');
  }
}

/**
 * Close tertiary sidebar
 */
function closeTertiarySidebar() {
  const sidebar = document.getElementById('tertiary-sidebar');
  if (sidebar) {
    sidebar.classList.remove('open');
  }
  availableVouchers = [];
  currentFlightId = null;
  currentTripId = null;
  currentFlightDetails = null;
}

/**
 * Remove a voucher attachment
 */
async function removeVoucherAttachment(flightId, attachmentId) {
  // Validate IDs before proceeding
  if (!flightId || !attachmentId || flightId === 'null' || attachmentId === 'null') {
    console.error('Invalid IDs for removal:', { flightId, attachmentId });
    alert('Error: Invalid flight or attachment ID');
    return;
  }

  if (!confirm('Are you sure you want to remove this voucher attachment?')) {
    return;
  }

  try {
    const response = await fetch(`/vouchers/flights/${flightId}/attachments/${attachmentId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      // Refresh the secondary sidebar with updated flight form
      refreshFlightAttachments(flightId);
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    console.error('Error removing attachment:', error);
    alert('Error removing voucher attachment');
  }
}
