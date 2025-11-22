/**
 * Voucher Sidebar Manager
 * Manages the tertiary sidebar for attaching and creating vouchers
 */

let availableVouchers = [];
let currentFlightId = null;
let currentTripId = null;
let currentFlightDetails = null;
let currentCompanions = [];

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
      fetch(`/api/trips/${tripId}/companions`),
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
  }

  // Open tertiary sidebar
  openTertiarySidebar();
}

/**
 * Render the voucher attachment panel in tertiary sidebar
 */
function renderVoucherPanel(companions) {
  // Store companions globally so they're available in updateSelectedVouchersInfo
  currentCompanions = companions || [];
  window.currentCompanions = currentCompanions;

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
          <label class="block text-sm font-medium text-gray-700 mb-3">Available Vouchers</label>
          <div class="overflow-x-auto border border-gray-300 rounded-md">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th class="px-3 py-2 text-left w-6">
                    <input type="checkbox" id="selectAllVouchers" onchange="toggleSelectAllVouchers()" class="rounded border-gray-300">
                  </th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700">Issuer & Number</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700">Balance</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700">Expires</th>
                </tr>
              </thead>
              <tbody>
                ${
                  availableVouchers.length === 0
                    ? `
                  <tr>
                    <td colspan="5" class="px-3 py-4 text-center text-gray-600">No vouchers available</td>
                  </tr>
                `
                    : availableVouchers
                        .sort((a, b) => {
                          // Sort by expiration date - soonest expiring at top
                          if (!a.expirationDate && !b.expirationDate) return 0;
                          if (!a.expirationDate) return 1; // No expiration goes to bottom
                          if (!b.expirationDate) return -1;
                          return new Date(a.expirationDate) - new Date(b.expirationDate);
                        })
                        .map((voucher) => {
                          // Calculate remaining balance
                          let remaining;
                          let remainingDisplay;
                          let balanceDisplay;

                          if (!voucher.totalValue) {
                            // Certificate type
                            remaining = null;
                            remainingDisplay = 'N/A';
                            balanceDisplay =
                              '<span class="text-purple-600 font-medium">Certificate</span>';
                          } else {
                            // Credit/Card type
                            const usedAmount = voucher.usedAmount || 0;
                            remaining = parseFloat(voucher.totalValue) - parseFloat(usedAmount);
                            remainingDisplay = remaining.toFixed(2);
                            balanceDisplay = `<span class="text-gray-900 font-medium">${voucher.currency} ${remainingDisplay}</span>`;
                          }

                          let expirationText = 'No expiration';
                          if (voucher.expirationDate) {
                            const date = new Date(voucher.expirationDate);
                            const day = String(date.getDate()).padStart(2, '0');
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const month = months[date.getMonth()];
                            const year = date.getFullYear();
                            expirationText = `${day} ${month} ${year}`;
                          }

                          const voucherType = voucher.type.replace(/_/g, ' ');
                          const typeColor =
                            voucher.type === 'TRAVEL_CREDIT'
                              ? 'bg-green-100 text-green-800'
                              : voucher.type === 'UPGRADE_CERT' ||
                                  voucher.type === 'REGIONAL_UPGRADE_CERT' ||
                                  voucher.type === 'GLOBAL_UPGRADE_CERT'
                                ? 'bg-purple-100 text-purple-800'
                                : voucher.type === 'COMPANION_CERT'
                                  ? 'bg-pink-100 text-pink-800'
                                  : voucher.type === 'GIFT_CARD'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800';

                          return `<tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="px-3 py-3 text-left">
                      <input type="checkbox" class="voucher-checkbox rounded border-gray-300" value="${voucher.id}" data-voucher-id="${voucher.id}" data-balance="${remaining}" data-currency="${voucher.currency}" data-type="${voucher.type}">
                    </td>
                    <td class="px-2 py-3 text-left w-24">
                      <span class="font-medium text-gray-900 text-xs">${voucher.issuer}</span>
                      <br>
                      <span class="text-xs text-gray-500">${voucher.voucherNumber}</span>
                    </td>
                    <td class="px-3 py-3 text-left w-32">
                      <span class="px-2 py-1 rounded text-xs font-medium ${typeColor} whitespace-nowrap">${voucherType}</span>
                    </td>
                    <td class="px-3 py-3 text-left">${balanceDisplay}</td>
                    <td class="px-3 py-3 text-left text-gray-600 text-xs">${expirationText}</td>
                  </tr>`;
                        })
                        .join('')
                }
              </tbody>
            </table>
          </div>
          <div id="selectedVouchersInfo" class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 hidden">
            <strong id="selectedVouchersCount">0</strong> voucher(s) selected
          </div>
        </div>

        <!-- Voucher details section for selected vouchers -->
        <div id="voucherDetailsSection" class="hidden">
          <label class="block text-sm font-medium text-gray-700 mb-3">Voucher Details</label>
          <div id="voucherDetailsContainer" class="space-y-3">
            <!-- Dynamically populated with traveler and amount fields for each selected voucher -->
          </div>
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
            <option value="REGIONAL_UPGRADE_CERT">Regional Upgrade Certificate</option>
            <option value="GLOBAL_UPGRADE_CERT">Global Upgrade Certificate</option>
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

    // Add event listeners to checkboxes after rendering
    setTimeout(() => {
      const voucherCheckboxes = document.querySelectorAll('.voucher-checkbox');
      voucherCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          updateSelectedVouchersInfo();
          // Update select-all checkbox state
          const selectAllCheckbox = document.getElementById('selectAllVouchers');
          const allChecked = Array.from(voucherCheckboxes).every((cb) => cb.checked);
          const someChecked = Array.from(voucherCheckboxes).some((cb) => cb.checked);
          selectAllCheckbox.checked = allChecked;
          selectAllCheckbox.indeterminate = someChecked && !allChecked;
        });
      });
    }, 0);
  }
}

/**
 * Switch between tabs in the voucher panel
 */
function switchVoucherTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.voucher-tab').forEach((tab) => {
    tab.classList.add('hidden');
    tab.classList.remove('active');
  });

  // Remove active class from all buttons
  document.querySelectorAll('.tab-button').forEach((btn) => {
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
 * Toggle select all vouchers
 */
function toggleSelectAllVouchers() {
  const selectAllCheckbox = document.getElementById('selectAllVouchers');
  const voucherCheckboxes = document.querySelectorAll('.voucher-checkbox');

  voucherCheckboxes.forEach((checkbox) => {
    checkbox.checked = selectAllCheckbox.checked;
  });

  updateSelectedVouchersInfo();
}

/**
 * Update selected vouchers info and details section
 */
function updateSelectedVouchersInfo() {
  const selectedCheckboxesNodeList = document.querySelectorAll('.voucher-checkbox:checked');
  const selectedCheckboxes = Array.from(selectedCheckboxesNodeList);
  const selectedVouchersInfo = document.getElementById('selectedVouchersInfo');
  const voucherDetailsSection = document.getElementById('voucherDetailsSection');
  const voucherDetailsContainer = document.getElementById('voucherDetailsContainer');
  const selectedVouchersCount = document.getElementById('selectedVouchersCount');

  selectedVouchersCount.textContent = selectedCheckboxes.length;

  if (selectedCheckboxes.length > 0) {
    selectedVouchersInfo.classList.remove('hidden');
    voucherDetailsSection.classList.remove('hidden');

    // Get companions data - stored in renderVoucherPanel context
    const companionOptions = window.currentCompanions || [];
    // userId is defined globally in trip.ejs as window.userId
    const { userId } = window;

    // Populate details container with traveler and amount fields for each selected voucher
    voucherDetailsContainer.innerHTML = selectedCheckboxes
      .map((checkbox) => {
        const { voucherId } = checkbox.dataset;
        const issuer = checkbox
          .closest('tr')
          .querySelector('td:nth-child(2) span:first-child').textContent;
        const voucherNumber = checkbox
          .closest('tr')
          .querySelector('td:nth-child(2) span:last-child').textContent;
        const voucherType = checkbox.dataset.type;
        const { balance } = checkbox.dataset;
        const { currency } = checkbox.dataset;
        const certificateTypes = [
          'UPGRADE_CERT',
          'REGIONAL_UPGRADE_CERT',
          'GLOBAL_UPGRADE_CERT',
          'COMPANION_CERT',
        ];

        // Build traveler select HTML
        let travelerSelectHtml = `
        <select id="traveler-${voucherId}" class="voucher-traveler-select w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white" data-voucher-id="${voucherId}" required>
          <option value="">Select traveler...</option>
          <option value="${userId}:USER">You</option>
      `;

        if (companionOptions && companionOptions.length > 0) {
          travelerSelectHtml += `<optgroup label="Travel Companions">`;
          companionOptions.forEach((c) => {
            travelerSelectHtml += `<option value="${c.id}:COMPANION">${c.name}</option>`;
          });
          travelerSelectHtml += `</optgroup>`;
        }

        travelerSelectHtml += `</select>`;

        if (certificateTypes.includes(voucherType)) {
          return `
          <div class="p-3 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
            <div class="flex items-start justify-between mb-2">
              <div>
                <div class="font-semibold text-sm text-gray-900">${issuer}</div>
                <div class="text-xs text-gray-600">${voucherNumber}</div>
              </div>
              <span class="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs font-medium rounded">Certificate</span>
            </div>
            <div class="mt-3">
              ${travelerSelectHtml}
            </div>
          </div>
        `;
        }
        // Ensure balance is a valid number - default to 999999 if invalid
        let numBalance = 0;
        if (balance && balance !== 'null' && balance !== 'undefined') {
          const parsed = parseFloat(balance);
          numBalance = !isNaN(parsed) ? parsed : 999999;
        } else {
          numBalance = 999999;
        }
        const maxAmount = numBalance.toFixed(2);
        return `
          <div class="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="font-semibold text-sm text-gray-900">${issuer}</div>
                <div class="text-xs text-gray-600">${voucherNumber}</div>
              </div>
              <span class="px-2 py-0.5 bg-blue-200 text-blue-800 text-xs font-medium rounded">${currency} ${maxAmount}</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Traveler *</label>
                ${travelerSelectHtml}
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
                <input type="number" id="amount-${voucherId}" data-voucher-id="${voucherId}" class="voucher-amount-input w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" step="0.01" min="0" max="${maxAmount}" placeholder="0.00" required>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  } else {
    selectedVouchersInfo.classList.add('hidden');
    voucherDetailsSection.classList.add('hidden');
    voucherDetailsContainer.innerHTML = '';
  }
}

/**
 * Handle voucher type change in new voucher form
 */
function onVoucherTypeChange(event) {
  const voucherType = event.target.value;
  const valueFields = document.getElementById('newValueFields');
  const certificateTypes = [
    'UPGRADE_CERT',
    'REGIONAL_UPGRADE_CERT',
    'GLOBAL_UPGRADE_CERT',
    'COMPANION_CERT',
  ];

  if (certificateTypes.includes(voucherType)) {
    valueFields.style.display = 'none';
    document.getElementById('newTotalValue').removeAttribute('required');
  } else {
    valueFields.style.display = 'block';
    document.getElementById('newTotalValue').setAttribute('required', 'required');
  }
}

/**
 * Submit multiple voucher attachments
 */
async function submitVoucherAttachment(event) {
  event.preventDefault();

  const selectedCheckboxesNodeList = document.querySelectorAll('.voucher-checkbox:checked');
  const selectedCheckboxes = Array.from(selectedCheckboxesNodeList);
  const notes = document.getElementById('attachmentNotes').value;
  const certificateTypes = [
    'UPGRADE_CERT',
    'REGIONAL_UPGRADE_CERT',
    'GLOBAL_UPGRADE_CERT',
    'COMPANION_CERT',
  ];

  // Validate
  if (selectedCheckboxes.length === 0) {
    alert('Please select at least one voucher');
    return;
  }

  // Collect voucher attachments with per-voucher travelers
  const attachments = [];

  for (const checkbox of selectedCheckboxes) {
    const { voucherId } = checkbox.dataset;
    const voucherType = checkbox.dataset.type;

    // Validate voucherId
    if (!voucherId || voucherId === 'undefined') {
      console.error('Invalid voucherId:', voucherId);
      alert('Error: Voucher ID is missing or invalid');
      return;
    }

    // Get traveler for this specific voucher
    const travelerSelect = document.getElementById(`traveler-${voucherId}`);
    if (!travelerSelect || !travelerSelect.value) {
      const issuer = checkbox
        .closest('tr')
        .querySelector('td:nth-child(2) span:first-child').textContent;
      alert(`Please select a traveler for ${issuer}`);
      return;
    }

    const [travelerId, travelerType] = travelerSelect.value.split(':');

    // Validate travelerId and travelerType
    if (
      !travelerId ||
      !travelerType ||
      travelerId === 'undefined' ||
      travelerType === 'undefined'
    ) {
      alert('Error: Traveler information is invalid. Please select a traveler again.');
      return;
    }

    let attachmentValue = null;

    // For non-certificate types, get the amount from the input field
    if (!certificateTypes.includes(voucherType)) {
      const amountInput = document.getElementById(`amount-${voucherId}`);
      if (!amountInput || !amountInput.value) {
        const issuer = checkbox
          .closest('tr')
          .querySelector('td:nth-child(2) span:first-child').textContent;
        alert(`Please enter an amount for ${issuer}`);
        return;
      }
      attachmentValue = parseFloat(amountInput.value);
    }

    attachments.push({
      voucherId,
      travelerId,
      travelerType,
      attachmentValue,
    });
  }

  // Log the payload for debugging
  console.log('Submitting voucher attachments:', { attachments, notes });

  // Send all attachments in a single request
  const payload = {
    attachments,
    notes,
  };

  try {
    const response = await fetch(`/vouchers/flights/${currentFlightId}/attach-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      // Check if there are partial vouchers that need new numbers
      if (result.partialVouchers && result.partialVouchers.length > 0) {
        // Prompt user for new voucher numbers for partial credits
        for (const partialVoucher of result.partialVouchers) {
          const newNumber = prompt(
            `A partial credit was created. Please enter the new credit number for the remaining balance:`,
            ''
          );

          if (newNumber && newNumber.trim()) {
            // Extract the voucher ID from the notes
            const voucherIdMatch = partialVoucher.notes.match(
              /New partial credit created: ([a-f0-9-]+)/
            );
            if (voucherIdMatch) {
              const newVoucherId = voucherIdMatch[1];
              try {
                await fetch(`/vouchers/${newVoucherId}/partial-number`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ newVoucherNumber: newNumber.trim() }),
                });
              } catch (error) {
                console.error('Error updating partial voucher number:', error);
              }
            }
          }
        }
      }

      // Refresh the tertiary sidebar (voucher panel) with updated available vouchers
      try {
        const vouchersResponse = await fetch(`/vouchers/available-for-flight/${currentFlightId}`);
        const vouchersResult = await vouchersResponse.json();

        if (vouchersResult.success) {
          availableVouchers = vouchersResult.data;

          // Fetch companions data
          const companionsResponse = await fetch(`/api/trips/${currentTripId}/companions`);
          const companionsResult = companionsResponse.ok
            ? await companionsResponse.json()
            : { success: false, data: [] };

          // Re-render the voucher panel with updated data
          renderVoucherPanel(companionsResult.success ? companionsResult.data : []);

          // Switch to attach tab in case user was viewing add tab
          switchVoucherTab('attach');
        }
      } catch (error) {
        console.error('Error refreshing voucher panel:', error);
      }

      // Refresh the secondary sidebar with updated flight form
      refreshFlightAttachments(currentFlightId);
    } else {
      console.error('Error attaching vouchers:', result.message);
      alert(`Error attaching vouchers: ${result.message}`);
    }
  } catch (error) {
    console.error('Error attaching vouchers:', error);
    alert('Error attaching vouchers');
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
  const certificateTypes = [
    'UPGRADE_CERT',
    'REGIONAL_UPGRADE_CERT',
    'GLOBAL_UPGRADE_CERT',
    'COMPANION_CERT',
  ];
  const ownerBoundTypes = ['TRAVEL_CREDIT', 'COMPANION_CERT', 'GIFT_CARD'];

  let totalValue = null;
  if (!certificateTypes.includes(voucherType)) {
    totalValue = document.getElementById('newTotalValue').value;
    if (!totalValue) {
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
    userId, // userId is a global const defined in trip.ejs
  };

  try {
    const response = await fetch('/vouchers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
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
            const companionsResult = companionsResponse.ok
              ? await companionsResponse.json()
              : { success: false, data: [] };

            // Re-render the attach tab with updated vouchers and companions
            renderVoucherPanel(companionsResult.success ? companionsResult.data : []);
            // Switch back to attach tab so user can attach the new voucher
            switchVoucherTab('attach');
          } else {
            console.error('Failed to fetch available vouchers:', vouchersResult);
          }
        } catch (error) {
          console.error('Error refreshing vouchers:', error);
        }
      } else {
        // No active flight context - just close the panel and let user reopen to see new voucher
        closeTertiarySidebar();
      }
    } else {
      console.error('Error creating voucher:', result.message);
    }
  } catch (error) {
    console.error('Error creating voucher:', error);
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
      scripts.forEach((script) => {
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
      if (typeof initializeAirportAutocomplete === 'function') {
        initializeAirportAutocomplete();
      }
    } else {
      console.error('Could not find secondary-sidebar-content container');
    }
  } catch (error) {
    console.error('Error refreshing flight attachments:', error);
  }
}

/**
 * Open tertiary sidebar
 */
function openTertiarySidebar() {
  console.log('[openTertiarySidebar] Called');
  const sidebar = document.getElementById('tertiary-sidebar');
  console.log('[openTertiarySidebar] sidebar element:', sidebar);
  if (sidebar) {
    console.log('[openTertiarySidebar] Adding open class');
    sidebar.classList.add('open');
    console.log('[openTertiarySidebar] classList now:', Array.from(sidebar.classList));
  }
}

// Also expose to window for global access
window.openTertiarySidebar = openTertiarySidebar;

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

  // Update URL based on current location
  // When closing tertiary sidebar, go back to the parent URL (without the certificate ID)
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/manage/certificates/')) {
    // If viewing certificate details, go back to /manage/certificates
    window.history.pushState({}, '', '/manage/certificates');
  }
}

// Also expose to window for global access
window.closeTertiarySidebar = closeTertiarySidebar;

/**
 * Remove a voucher attachment
 */
async function removeVoucherAttachment(flightId, attachmentId) {
  // Validate IDs before proceeding
  if (!flightId || !attachmentId || flightId === 'null' || attachmentId === 'null') {
    console.error('Invalid IDs for removal:', { flightId, attachmentId });
    return;
  }

  try {
    const response = await fetch(`/vouchers/flights/${flightId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      // Check if tertiary sidebar is open with voucher panel
      const tertiarySidebar = document.getElementById('tertiary-sidebar');
      const isVoucherPanelOpen = tertiarySidebar && tertiarySidebar.classList.contains('open');

      // If voucher panel is open and we're on the Attach Voucher tab, refresh the available vouchers
      if (isVoucherPanelOpen && currentFlightId === flightId) {
        try {
          // Fetch updated available vouchers
          const vouchersResponse = await fetch(`/vouchers/available-for-flight/${flightId}`);
          const vouchersResult = await vouchersResponse.json();

          if (vouchersResult.success) {
            availableVouchers = vouchersResult.data;

            // Fetch companions data
            const companionsResponse = await fetch(`/api/trips/${currentTripId}/companions`);
            const companionsResult = companionsResponse.ok
              ? await companionsResponse.json()
              : { success: false, data: [] };

            // Re-render the voucher panel with updated data
            renderVoucherPanel(companionsResult.success ? companionsResult.data : []);
          }
        } catch (error) {
          console.error('Error refreshing voucher panel:', error);
        }
      }

      // Refresh the secondary sidebar with updated flight form
      refreshFlightAttachments(flightId);
    } else {
      console.error('Error removing voucher attachment:', result.message);
    }
  } catch (error) {
    console.error('Error removing attachment:', error);
  }
}

// Expose currentFlightId globally for cross-module access
Object.defineProperty(window, 'currentFlightId', {
  get: () => currentFlightId,
  set: (value) => {
    currentFlightId = value;
  },
});

// Expose the implementation for lazy loading wrapper
window.openVoucherAttachmentPanelImpl = openVoucherAttachmentPanel;

// Expose functions globally for inline onclick/onsubmit/onchange handlers in voucher panel
window.switchVoucherTab = switchVoucherTab;
window.submitVoucherAttachment = submitVoucherAttachment;
window.toggleSelectAllVouchers = toggleSelectAllVouchers;
window.submitNewVoucher = submitNewVoucher;
window.onVoucherTypeChange = onVoucherTypeChange;
window.removeVoucherFromFlight = removeVoucherFromFlight;
