<script lang="ts">
  import Card from './Card.svelte';

  export let tripId: string;
  export let events: any[] = [];
  export let flights: any[] = [];
  export let hotels: any[] = [];
  export let startDate: string = '';
  export let endDate: string = '';

  interface TimelineEvent {
    id: string;
    date: string;
    type: 'flight' | 'hotel' | 'event';
    title: string;
    description?: string;
    time?: string;
  }

  let timelineEvents: TimelineEvent[] = [];

  $: {
    timelineEvents = [];

    // Add flights
    flights.forEach((flight) => {
      if (flight.departureDate) {
        timelineEvents.push({
          id: `flight-${flight.id}`,
          date: flight.departureDate,
          type: 'flight',
          title: `Flight: ${flight.origin} → ${flight.destination}`,
          description: `${flight.airline} ${flight.flightNumber || ''}`.trim(),
          time: flight.departureTime
        });
      }
    });

    // Add hotels
    hotels.forEach((hotel) => {
      if (hotel.checkInDate) {
        timelineEvents.push({
          id: `hotel-${hotel.id}`,
          date: hotel.checkInDate,
          type: 'hotel',
          title: `Hotel Check-in: ${hotel.name}`,
          description: hotel.location
        });
      }
    });

    // Add events
    events.forEach((event) => {
      if (event.date) {
        timelineEvents.push({
          id: `event-${event.id}`,
          date: event.date,
          type: 'event',
          title: event.name,
          description: `${event.category} at ${event.location || 'TBD'}`,
          time: event.time
        });
      }
    });

    // Sort by date
    timelineEvents.sort((a, b) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();
      return aDate - bDate;
    });
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  function formatTime(timeString: string): string {
    if (!timeString) return '';
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return timeString;
    }
  }

  function getEventTypeColor(type: string): string {
    switch (type) {
      case 'flight':
        return '#007bff';
      case 'hotel':
        return '#28a745';
      case 'event':
        return '#ffc107';
      default:
        return '#666';
    }
  }

  function getEventTypeLabel(type: string): string {
    switch (type) {
      case 'flight':
        return '✈️ Flight';
      case 'hotel':
        return '🏨 Hotel';
      case 'event':
        return '📍 Event';
      default:
        return type;
    }
  }
</script>

<Card title="Trip Timeline">
  {#if timelineEvents.length === 0}
    <div class="empty-timeline">
      <p>No events scheduled yet</p>
    </div>
  {:else}
    <div class="timeline">
      {#each timelineEvents as event (event.id)}
        <div class="timeline-item">
          <div class="timeline-marker" style="--marker-color: {getEventTypeColor(event.type)}">
            <div class="marker-dot" />
          </div>

          <div class="timeline-content">
            <div class="event-header">
              <span class="event-type">
                {getEventTypeLabel(event.type)}
              </span>
              <span class="event-date">
                {formatDate(event.date)}
                {#if event.time}
                  <span class="event-time">@ {formatTime(event.time)}</span>
                {/if}
              </span>
            </div>

            <div class="event-title">
              {event.title}
            </div>

            {#if event.description}
              <div class="event-description">
                {event.description}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</Card>

<style>
  .empty-timeline {
    text-align: center;
    padding: 2rem 1rem;
    color: #999;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    padding: 1rem 0;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 24px;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #e0e0e0;
  }

  .timeline-item {
    display: flex;
    gap: 1.5rem;
    position: relative;
  }

  .timeline-marker {
    position: relative;
    z-index: 1;
    margin-top: 0.25rem;
  }

  .marker-dot {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: white;
    border: 3px solid var(--marker-color);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timeline-content {
    flex: 1;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
    gap: 1rem;
  }

  .event-type {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background-color: #f0f0f0;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
  }

  .event-date {
    font-size: 0.9rem;
    color: #666;
    white-space: nowrap;
  }

  .event-time {
    display: block;
    font-size: 0.8rem;
    color: #999;
  }

  .event-title {
    font-size: 1rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }

  .event-description {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.25rem;
  }

  @media (max-width: 600px) {
    .event-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .event-date {
      white-space: normal;
    }
  }
</style>
