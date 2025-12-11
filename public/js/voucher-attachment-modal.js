/**
 * Voucher Attachment Modal
 * Manages the modal for attaching vouchers to flights
 */

let availableVouchers = [];
let currentFlightId = null;
let currentTripId = null;

/**
 * Open the voucher attachment modal for a flight
 * @param {string} flightId - The flight ID to attach vouchers to
 * @param {string} tripId - The trip ID (for fetching companions)
 * @param {string} flightDetails - Display text for the flight
 */
async function openVoucherAttachmentModal(flightId, tripId, flightDetails) {
  currentFlightId = flightId;
  currentTripId = tripId;

  // Populate modal header with flight info
  document.getElementById('voucherFlightInfo').textContent = flightDetails;

  // Fetch available vouchers for this flight
  try {
    const response = await fetch(`/vouchers/available-for-flight/${flightId}`);
    const result = await response.json();

    if (result.success) {
      availableVouchers = result.data;
      populateVoucherSelect();
    }
  } catch (error) {
    // Error fetching vouchers
  }

  // Fetch current trip's companions
  try {
    const response = await fetch(`/api/trips/${tripId}/companions`);
    const result = await response.json();

    if (result.success) {
      populateTravelerSelect(result.data);
    }
  } catch (error) {
    // Still show modal even if companions fail to load
  }

  // Show modal
  document.getElementById('voucherAttachmentModal').classList.remove('hidden');
}

/**
 * Close the voucher attachment modal
 */
function closeVoucherAttachmentModal() {
  document.getElementById('voucherAttachmentModal').classList.add('hidden');
  document.getElementById('attachmentForm').reset();
  availableVouchers = [];
  currentFlightId = null;
  currentTripId = null;
}

/**
 * Populate the voucher select dropdown
 */
function populateVoucherSelect() {
  const select = document.getElementById('voucherSelect');
  select.innerHTML = '<option value="">Select a voucher...</option>';

  availableVouchers.forEach((voucher) => {
    const remaining = parseFloat(voucher.totalValue) - parseFloat(voucher.usedAmount);
    let expirationText = 'No expiration';
    if (voucher.expirationDate) {
      const date = new Date(voucher.expirationDate);
      const day = String(date.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      expirationText = `${day} ${month} ${year}`;
    }

    const option = document.createElement('option');
    option.value = voucher.id;
    option.textContent = `${voucher.issuer} - ${voucher.voucherNumber} (${voucher.currency} ${remaining.toFixed(2)} remaining, expires ${expirationText})`;
    option.dataset.voucherId = voucher.id;
    option.dataset.balance = remaining;
    option.dataset.currency = voucher.currency;

    select.appendChild(option);
  });
}

/**
 * Handle voucher selection change
 */
function onVoucherSelected(event) {
  const selectedValue = event.target.value;

  if (!selectedValue) {
    document.getElementById('maxAttachmentValue').textContent = '—';
    document.getElementById('attachmentValue').max = '';
    document.getElementById('attachmentValue').value = '';
    return;
  }

  const selectedOption = event.target.options[event.target.selectedIndex];
  const { balance } = selectedOption.dataset;
  const { currency } = selectedOption.dataset;

  document.getElementById('maxAttachmentValue').textContent =
    `${currency} ${parseFloat(balance).toFixed(2)}`;
  document.getElementById('attachmentValue').max = balance;
  document.getElementById('attachmentValue').value = '';
}

/**
 * Populate the traveler select dropdown
 * @param {Array} companions - List of companions for this trip
 */
function populateTravelerSelect(companions) {
  const select = document.getElementById('travelerId');
  select.innerHTML = '';

  // Add current user as first option
  const userOption = document.createElement('option');
  userOption.value = `${window.userId}:USER`;
  userOption.textContent = `You (${window.userName})`;
  select.appendChild(userOption);

  // Add companions
  if (companions && companions.length > 0) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = 'Travel Companions';

    companions.forEach((companion) => {
      const option = document.createElement('option');
      option.value = `${companion.id}:COMPANION`;
      option.textContent = companion.name;
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  }
}

/**
 * Handle form submission for attaching voucher
 */
async function submitVoucherAttachment(event) {
  event.preventDefault();

  const voucherId = document.getElementById('voucherSelect').value;
  const travelerValue = document.getElementById('travelerId').value;
  const attachmentValue = document.getElementById('attachmentValue').value;
  const notes = document.getElementById('attachmentNotes').value;

  if (!voucherId || !travelerValue || !attachmentValue) {
    alert('Please fill in all required fields');
    return;
  }

  const [travelerId, travelerType] = travelerValue.split(':');

  const payload = {
    voucherId,
    travelerId,
    travelerType,
    attachmentValue: parseFloat(attachmentValue),
    notes,
  };

  try {
    const response = await fetch(`/vouchers/flights/${currentFlightId}/attach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      closeVoucherAttachmentModal();
      alert('Voucher attached successfully!');

      // Refresh flight attachments display if available
      if (typeof refreshFlightAttachments === 'function') {
        refreshFlightAttachments(currentFlightId);
      } else {
        location.reload();
      }
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    alert('Error attaching voucher');
  }
}

/**
 * Initialize the modal when page loads
 * (inject HTML if not already present)
 */
function initializeVoucherAttachmentModal() {
  // Check if modal HTML already exists
  if (document.getElementById('voucherAttachmentModal')) {
    return;
  }

  const modalHTML = `
    <div id="voucherAttachmentModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Attach Voucher</h2>
            <p class="text-sm text-gray-600 mt-1">Flight: <span id="voucherFlightInfo"></span></p>
          </div>
          <button onclick="closeVoucherAttachmentModal()" class="text-gray-400 hover:text-gray-600">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="attachmentForm" onsubmit="submitVoucherAttachment(event)" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Select Voucher *</label>
            <select id="voucherSelect" onchange="onVoucherSelected(event)" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
              <option value="">Loading vouchers...</option>
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Attachment Amount *</label>
              <input type="number" id="attachmentValue" name="attachmentValue" step="0.01" min="0" required placeholder="0.00" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <p class="text-xs text-gray-600 mt-1">Max available: <span id="maxAttachmentValue">—</span></p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Traveler *</label>
              <select id="travelerId" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                <option value="">Loading travelers...</option>
              </select>
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
            <button type="button" onclick="closeVoucherAttachmentModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Inject modal HTML at end of body
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modalHTML;
  document.body.appendChild(tempDiv.firstElementChild);
}

// Initialize modal when DOM is ready
document.addEventListener('DOMContentLoaded', initializeVoucherAttachmentModal);
