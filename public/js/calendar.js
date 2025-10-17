// Calendar functionality for trip calendar view
// This file is loaded by trips/calendar.ejs

document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  
  if (!calendarEl) {
    console.error('Calendar element not found');
    return;
  }

  // Calendar configuration
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    firstDay: 1, // Start week on Monday
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    height: 'auto',
    editable: true,
    eventClick: function(info) {
      // Show event details in alert
      const eventDetails = `
Event: ${info.event.title}
Start: ${info.event.start.toLocaleString()}
${info.event.end ? 'End: ' + info.event.end.toLocaleString() : ''}
Type: ${info.event.extendedProps.type || 'Unknown'}
      `.trim();
      
      alert(eventDetails);
    },
    eventDrop: function(info) {
      // Handle drag and drop - this would need backend implementation
      if (confirm(`Move "${info.event.title}" to ${info.event.start.toLocaleString()}?`)) {
        // TODO: Implement API call to update event time
        console.log('Event dropped:', {
          id: info.event.id,
          title: info.event.title,
          start: info.event.start,
          end: info.event.end,
          type: info.event.extendedProps.type
        });
        
        // For now, show success message
        showAlert('Event updated successfully!', 'success');
      } else {
        info.revert();
      }
    },
    eventResize: function(info) {
      // Handle event resize
      if (confirm(`Change duration of "${info.event.title}"?`)) {
        // TODO: Implement API call to update event duration
        console.log('Event resized:', {
          id: info.event.id,
          start: info.event.start,
          end: info.event.end
        });
        
        showAlert('Event duration updated!', 'success');
      } else {
        info.revert();
      }
    }
  });
  
  calendar.render();
});

function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
  alertDiv.style.zIndex = '9999';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}
