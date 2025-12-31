<script lang="ts">
  import { onMount } from 'svelte';

  export let trips: any[] = [];
  export let standaloneItems: any = { flights: [], hotels: [], transportation: [], carRentals: [], events: [] };
  export let onItemClick: (type: string, itemType: string, data: any) => void = () => {};

  interface CalendarItem {
    id: string;
    type: 'trip' | 'flight' | 'hotel' | 'event' | 'transportation' | 'carRental';
    data: any;
    startDate: Date;
    endDate: Date;
    durationDays: number;
  }

  interface DayData {
    day: number | null;
    dateKey: string | null;
    items: CalendarItem[];
    isToday: boolean;
    isBlank: boolean;
  }

  interface MonthData {
    month: number;
    year: number;
    name: string;
    days: DayData[];
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const itemColors: Record<string, string> = {
    trip: '#28536b',
    flight: '#d4a823',
    hotel: '#9b6db3',
    event: '#d6389f',
    transportation: '#2b7ab6',
    carRental: '#d97a2f'
  };

  let months: MonthData[] = [];
  let dateToItems: Record<string, CalendarItem[]> = {};
  let globalItemRowAssignments: Record<string, number> = {};
  let today = new Date();

  // Special dates to highlight for 2026 (YYYY-MM-DD format)
  const specialDates = new Set([
    '2026-01-01', // January 1
    '2026-01-19', // January 19
    '2026-05-25', // May 25
    '2026-06-19', // June 19
    '2026-07-03', // July 3
    '2026-09-07', // September 7
    '2026-11-26', // November 26
    '2026-11-27', // November 27
    '2026-12-24', // December 24
    '2026-12-25', // December 25
    '2026-12-28', // December 28
    '2026-12-29', // December 29
    '2026-12-30', // December 30
    '2026-12-31'  // December 31
  ]);

  function isSpecialDate(dateKey: string): boolean {
    if (!dateKey) return false;
    return specialDates.has(dateKey);
  }

  $: {
    buildCalendarData();
  }

  function getDateKey(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseDateOnly(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  function normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  function buildCalendarData() {
    today = new Date();
    today.setHours(0, 0, 0, 0);

    dateToItems = {};
    const startMonth = new Date(today);
    startMonth.setMonth(today.getMonth() - 3);
    startMonth.setDate(1);

    const endMonth = new Date(today);
    endMonth.setMonth(today.getMonth() + 15);
    endMonth.setDate(1);

    // Helper to get end of month date
    function getMonthEndDate(date: Date): Date {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0, 0, 0, 0, 0);
    }

    // Helper to add item to a specific date
    function addItemToDate(dateStr: string, item: CalendarItem) {
      if (!dateToItems[dateStr]) dateToItems[dateStr] = [];
      // Only add if not already present (avoid duplicates)
      if (!dateToItems[dateStr].some(i => i.id === item.id)) {
        dateToItems[dateStr].push(item);
      }
    }

    // Helper to add item across all months it spans
    function addItemAcrossMonths(item: CalendarItem) {
      const startKey = getDateKey(item.startDate);
      addItemToDate(startKey, item);

      // For items spanning multiple months, add to first day of each subsequent month
      let currentMonthStart = new Date(item.startDate);
      currentMonthStart.setMonth(currentMonthStart.getMonth() + 1);
      currentMonthStart.setDate(1);
      while (currentMonthStart <= item.endDate) {
        const monthStartKey = getDateKey(currentMonthStart);
        addItemToDate(monthStartKey, item);
        currentMonthStart.setMonth(currentMonthStart.getMonth() + 1);
      }
    }

    // Add trips
    trips.forEach((trip) => {
      if (!trip.departureDate || !trip.returnDate) return;
      const depDate = parseDateOnly(trip.departureDate);
      const retDate = parseDateOnly(trip.returnDate);
      const durationDays = Math.ceil((retDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const tripItem: CalendarItem = {
        id: trip.id,
        type: 'trip',
        data: trip,
        startDate: depDate,
        endDate: retDate,
        durationDays
      };

      addItemAcrossMonths(tripItem);

      // Add flights
      if (trip.flights) {
        trip.flights.forEach((flight: any) => {
          if (!flight.departureDateTime) return;
          let startDate = new Date(flight.departureDateTime);
          startDate.setHours(0, 0, 0, 0);
          let endDate = new Date(flight.arrivalDateTime || flight.departureDateTime);
          endDate.setHours(0, 0, 0, 0);
          const flightDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          addItemAcrossMonths({
            id: flight.id,
            type: 'flight',
            data: flight,
            startDate,
            endDate,
            durationDays: flightDurationDays
          });
        });
      }

      // Add hotels
      if (trip.hotels) {
        trip.hotels.forEach((hotel: any) => {
          if (!hotel.checkInDateTime) return;
          let startDate = new Date(hotel.checkInDateTime);
          startDate.setHours(0, 0, 0, 0);
          let endDate = new Date(hotel.checkOutDateTime || hotel.checkInDateTime);
          endDate.setHours(0, 0, 0, 0);
          const hotelDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          addItemAcrossMonths({
            id: hotel.id,
            type: 'hotel',
            data: hotel,
            startDate,
            endDate,
            durationDays: hotelDurationDays
          });
        });
      }

      // Add events
      if (trip.events) {
        trip.events.forEach((event: any) => {
          if (!event.startDateTime) return;
          let startDate = new Date(event.startDateTime);
          startDate.setHours(0, 0, 0, 0);
          let endDate = new Date(event.endDateTime || event.startDateTime);
          endDate.setHours(0, 0, 0, 0);
          const eventDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          addItemAcrossMonths({
            id: event.id,
            type: 'event',
            data: event,
            startDate,
            endDate,
            durationDays: eventDurationDays
          });
        });
      }

      // Add transportation
      if (trip.transportation) {
        trip.transportation.forEach((trans: any) => {
          if (!trans.departureDateTime) return;
          let startDate = new Date(trans.departureDateTime);
          startDate.setHours(0, 0, 0, 0);
          let endDate = new Date(trans.arrivalDateTime || trans.departureDateTime);
          endDate.setHours(0, 0, 0, 0);
          const transDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          addItemAcrossMonths({
            id: trans.id,
            type: 'transportation',
            data: trans,
            startDate,
            endDate,
            durationDays: transDurationDays
          });
        });
      }

      // Add car rentals
      if (trip.carRentals) {
        trip.carRentals.forEach((carRental: any) => {
          if (!carRental.pickupDateTime) return;
          let startDate = new Date(carRental.pickupDateTime);
          startDate.setHours(0, 0, 0, 0);
          let endDate = new Date(carRental.dropoffDateTime || carRental.pickupDateTime);
          endDate.setHours(0, 0, 0, 0);
          const carDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          addItemAcrossMonths({
            id: carRental.id,
            type: 'carRental',
            data: carRental,
            startDate,
            endDate,
            durationDays: carDurationDays
          });
        });
      }
    });

    // Add standalone items
    ['flights', 'hotels', 'transportation', 'carRentals', 'events'].forEach((key) => {
      const typeMap: Record<string, string> = {
        flights: 'flight',
        hotels: 'hotel',
        transportation: 'transportation',
        carRentals: 'carRental',
        events: 'event'
      };
      const itemType = typeMap[key];

      if (standaloneItems[key]) {
        standaloneItems[key].forEach((item: any) => {
          let startDate: Date;
          let endDate: Date;

          if (key === 'flights') {
            startDate = new Date(item.departureDateTime);
            endDate = new Date(item.arrivalDateTime || item.departureDateTime);
          } else if (key === 'hotels') {
            startDate = new Date(item.checkInDateTime);
            endDate = new Date(item.checkOutDateTime || item.checkInDateTime);
          } else if (key === 'transportation') {
            startDate = new Date(item.departureDateTime);
            endDate = new Date(item.arrivalDateTime || item.departureDateTime);
          } else if (key === 'carRentals') {
            startDate = new Date(item.pickupDateTime);
            endDate = new Date(item.dropoffDateTime || item.pickupDateTime);
          } else if (key === 'events') {
            startDate = new Date(item.startDateTime);
            endDate = new Date(item.endDateTime || item.startDateTime);
          } else {
            return;
          }

          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);

          const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          addItemAcrossMonths({
            id: item.id,
            type: itemType as any,
            data: item,
            startDate,
            endDate,
            durationDays
          });
        });
      }
    });

    // Calculate global row assignments
    assignItemRows();

    // Build month data
    buildMonthData(startMonth, endMonth);
  }

  function assignItemRows() {
    globalItemRowAssignments = {};
    const globalRowOccupancy: CalendarItem[][] = [];
    const allItems = Object.values(dateToItems).flat();
    const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());

    uniqueItems.forEach((item) => {
      const itemStart = normalizeDate(item.startDate).getTime();
      const itemEnd = normalizeDate(item.endDate).getTime();

      let assignedRow = -1;
      for (let rowIdx = 0; rowIdx < globalRowOccupancy.length; rowIdx++) {
        let canFitInRow = true;
        for (const otherItem of globalRowOccupancy[rowIdx]) {
          const otherStart = normalizeDate(otherItem.startDate).getTime();
          const otherEnd = normalizeDate(otherItem.endDate).getTime();
          const overlaps = !(itemEnd < otherStart || itemStart > otherEnd);
          if (overlaps) {
            canFitInRow = false;
            break;
          }
        }
        if (canFitInRow) {
          assignedRow = rowIdx;
          globalRowOccupancy[rowIdx].push(item);
          break;
        }
      }

      if (assignedRow === -1) {
        assignedRow = globalRowOccupancy.length;
        globalRowOccupancy.push([item]);
      }

      globalItemRowAssignments[item.id] = assignedRow;
    });
  }

  function buildMonthData(startMonth: Date, endMonth: Date) {
    months = [];
    let currentDate = new Date(startMonth);

    while (currentDate < endMonth) {
      const monthYear = { month: currentDate.getMonth(), year: currentDate.getFullYear() };
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

      const days: DayData[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 0, 0, 0, 0);
        const key = getDateKey(dateObj);
        days.push({
          day,
          dateKey: key,
          items: dateToItems[key] || [],
          isToday: key === getDateKey(today),
          isBlank: false
        });
      }

      // Pad to 31 days
      for (let i = daysInMonth; i < 31; i++) {
        days.push({
          day: null,
          dateKey: null,
          items: [],
          isToday: false,
          isBlank: true
        });
      }

      months.push({
        month: monthYear.month,
        year: monthYear.year,
        name: monthNames[monthYear.month],
        days
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  function getItemColor(item: CalendarItem): string {
    return itemColors[item.type] || '#666666';
  }

  function getItemLabel(item: CalendarItem): string {
    const { type, data } = item;
    if (type === 'trip') return data.name;
    if (type === 'flight') return `${data.origin?.substring(0, 3) || '?'} → ${data.destination?.substring(0, 3) || '?'}`;
    if (type === 'hotel') return data.hotelName || data.name || 'Hotel';
    if (type === 'event') return data.name || 'Event';
    if (type === 'transportation') return `${data.method || 'Transit'}`;
    if (type === 'carRental') return data.company || 'Car Rental';
    return 'Item';
  }

  function getItemIcon(item: CalendarItem): string {
    const iconMap: Record<string, string> = {
      trip: 'luggage',
      flight: 'flight',
      hotel: 'hotel',
      event: 'event',
      transportation: 'train',
      carRental: 'directions_car'
    };
    return iconMap[item.type] || 'info';
  }

  function handleItemClick(item: CalendarItem) {
    onItemClick(item.type, item.type, item.data);
  }
</script>

<div class="calendar-container">
  <div class="calendar-grid">
    {#each months as monthData (monthData.year * 12 + monthData.month)}
      {@const maxRowInMonth = monthData.days.flatMap(d => d.items).reduce((max, item) => {
        const row = globalItemRowAssignments[item.id] ?? 0;
        return Math.max(max, row);
      }, -1)}
      {@const monthHeight = Math.max(2, 1.2 + (maxRowInMonth + 1) * 1.75)}

      <div class="month-row" style="min-height: {monthHeight}rem;">
        <!-- Month label -->
        <div class="month-label">
          <div class="month-name">{monthData.name.substring(0, 3)}</div>
          <div class="year">{monthData.year}</div>
        </div>

        <!-- Days grid -->
        <div class="days-grid">
          <!-- Items layer -->
          <div class="items-layer">
            {#each monthData.days as day, dayIdx}
              {#each day.items as item (item.id)}
                {@const rowInMonth = globalItemRowAssignments[item.id] ?? 0}
                {@const startDayIdx = monthData.days.findIndex(d => d.dateKey === getDateKey(item.startDate))}
                {@const endDayIdx = monthData.days.findIndex(d => d.dateKey === getDateKey(item.endDate))}
                {@const displayStartIdx = startDayIdx >= 0 ? startDayIdx : (startDayIdx < 0 && endDayIdx >= 0 ? 0 : dayIdx)}
                {@const daysSpanned = Math.max(1, (endDayIdx >= 0 ? endDayIdx : 30) - displayStartIdx + 1)}

                {#if startDayIdx === dayIdx || (startDayIdx < 0 && dayIdx === 0 && endDayIdx >= 0)}
                  <div
                    class="item-bar"
                    class:flight-item={item.type === 'flight'}
                    style="
                      --day-idx: {displayStartIdx};
                      --span: {daysSpanned};
                      --row-in-month: {rowInMonth};
                      background-color: {getItemColor(item)}4d;
                      color: {item.type === 'flight' ? '#5a4a0f' : getItemColor(item)};
                    "
                    on:click={() => handleItemClick(item)}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === 'Enter' && handleItemClick(item)}
                  >
                    {#if item.type !== 'flight'}
                      <span class="material-symbols-outlined">{getItemIcon(item)}</span>
                    {/if}
                    {#if item.type === 'flight'}
                      <div class="flight-info">
                        <div class="flight-line">{item.data.origin?.substring(0, 3) || '?'}</div>
                        <div class="flight-line">{item.data.destination?.substring(0, 3) || '?'}</div>
                      </div>
                    {:else}
                      <span class="item-label">{getItemLabel(item)}</span>
                    {/if}
                  </div>
                {/if}
              {/each}
            {/each}
          </div>

          <!-- Day cells -->
          {#each monthData.days as day, dayIdx}
            <div
              class="day-cell"
              class:today={day.isToday}
              class:blank={day.isBlank}
              class:weekend={!day.isBlank && day.dateKey && new Date(day.dateKey).getDay() % 6 === 0}
              class:special={day.dateKey && isSpecialDate(day.dateKey)}
            >
              {#if !day.isBlank && day.day}
                <span class="day-number">{day.day}</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .calendar-container {
    height: 100%;
    overflow-y: auto;
    padding: 1rem;
  }

  .calendar-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .month-row {
    display: flex;
    gap: 0;
    align-items: stretch;
    position: relative;
  }

  .month-label {
    width: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: #9ca3af;
    background: #ffffff70;
    padding: 0.5rem 0.25rem;
    flex-shrink: 0;
    text-align: center;
    border-right: 1px solid #f3f4f6;
  }

  .month-name {
    font-weight: 700;
  }

  .year {
    font-size: 0.65rem;
    color: #9ca3af;
  }

  .days-grid {
    display: grid;
    grid-template-columns: repeat(31, minmax(24px, 1fr));
    gap: 0;
    flex: 1;
    position: relative;
  }

  .items-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
    display: flex;
    flex-direction: column;
  }

  .item-bar {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    height: 1.5rem;
    pointer-events: auto;
    cursor: pointer;
    top: calc(1.2rem + var(--row-in-month) * 1.75rem);
    left: calc(var(--day-idx) * calc(100% / 31) + 1px);
    width: calc(var(--span) * calc(100% / 31) - 2px);
    transition: opacity 0.2s;
  }

  .item-bar.flight-item {
    padding: 0.15rem 0.25rem;
  }

  .flight-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1;
    min-width: 0;
    justify-content: center;
    align-items: center;
  }

  .flight-line {
    font-size: 0.6rem;
    line-height: 0.8;
    white-space: nowrap;
  }

  .item-bar:hover {
    opacity: 0.85;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .item-bar :global(.material-symbols-outlined) {
    font-size: 14px;
    flex-shrink: 0;
  }

  .item-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .day-cell {
    border-right: 1px solid rgba(229, 231, 235, 0.4);
    padding: 0;
    overflow: visible;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    min-height: 32px;
    background: #FFFFFF90;
    transition: background-color 0.2s;
  }

  .day-cell:hover {
    background-color: #FFFFFFCC;
  }

  .day-cell.weekend {
    background-color: #f0f0f070;
  }

  .day-cell.weekend:hover {
    background-color: #f0f0f0a0;
  }

  .day-cell.today {
    background-color: #eff6ff;
    border-right-color: #3b82f6;
  }

  .day-cell.today .day-number {
    color: #3b82f6;
    font-weight: 600;
  }

  .day-cell.blank {
    background-color: #f3f4f6;
    cursor: default;
  }

  .day-cell.blank:hover {
    background-color: #f3f4f6;
  }

  .day-cell.special {
    background-color: #fee2e2;
  }

  .day-cell.special:hover {
    background-color: #fecaca;
  }

  .day-number {
    font-size: 0.7rem;
    font-weight: 500;
    color: #374151;
    padding: 0.25rem;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 5;
  }

  @media (max-width: 768px) {
    .calendar-container {
      padding: 0.5rem;
    }

    .month-label {
      width: 40px;
      font-size: 0.7rem;
    }

    .item-bar {
      font-size: 0.65rem;
      padding: 0.2rem 0.4rem;
      height: 1.25rem;
    }

    .item-bar :global(.material-symbols-outlined) {
      font-size: 12px;
    }
  }
</style>
