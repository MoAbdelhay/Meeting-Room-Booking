// Sample room data
const rooms = [
  { id: 1, name: 'Alrajeh Meeting Room', capacity: 10 }
];

// DOM Elements
const roomsList = document.getElementById('rooms-list');
const bookingForm = document.getElementById('booking-form');
const bookingsList = document.getElementById('bookings-list');
const roomNameInput = document.getElementById('room-name');
const dateInput = document.getElementById('date');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const nameInput = document.getElementById('name');

let calendar;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadRooms();
  loadBookings();
  setupFormValidation();
  
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);

  // Initialize calendar
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: getCalendarEvents(),
    eventClick: (info) => {
      if (confirm('Delete this booking?')) {
        deleteBooking(info.event.id);
      }
    }
  });
  calendar.render();
});

function loadRooms() {
  roomsList.innerHTML = rooms.map(room => `
    <div class="room-card" data-room-id="${room.id}">
      <h3>${room.name}</h3>
      <p>Capacity: ${room.capacity} people</p>
    </div>
  `).join('');

  // Add click handlers to room cards
  document.querySelectorAll('.room-card').forEach(card => {
    card.addEventListener('click', () => selectRoom(card.dataset.roomId));
  });
}

function selectRoom(roomId) {
  const room = rooms.find(r => r.id === Number(roomId));
  if (!room) return;

  roomNameInput.value = room.name;
  bookingForm.classList.remove('hidden');
  bookingForm.scrollIntoView({ behavior: 'smooth' });
}

function setupFormValidation() {
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!validateBooking()) return;
    
    const booking = {
      room: roomNameInput.value,
      date: dateInput.value,
      startTime: startTimeInput.value,
      endTime: endTimeInput.value,
      name: nameInput.value,
      id: Date.now()
    };
    
    saveBooking(booking);
    bookingForm.reset();
    bookingForm.classList.add('hidden');
    loadBookings();
  });

  document.getElementById('cancel-booking').addEventListener('click', () => {
    bookingForm.reset();
    bookingForm.classList.add('hidden');
  });
}

function validateBooking() {
  const start = new Date(`2025-01-01T${startTimeInput.value}`);
  const end = new Date(`2025-01-01T${endTimeInput.value}`);
  
  if (start >= end) {
    alert('End time must be after start time');
    return false;
  }
  
  return true;
}

function saveBooking(booking) {
  const bookings = getBookings();
  bookings.push(booking);
  localStorage.setItem('bookings', JSON.stringify(bookings));
}

function getCalendarEvents() {
  return getBookings().map(booking => ({
    id: booking.id,
    title: `${booking.room} - ${booking.name}`,
    start: `${booking.date}T${booking.startTime}`,
    end: `${booking.date}T${booking.endTime}`,
    allDay: false
  }));
}

function loadBookings() {
  const bookings = getBookings();
  bookingsList.innerHTML = bookings.map(booking => `
    <div class="booking-item">
      <h3>${booking.room}</h3>
      <p>Date: ${booking.date}</p>
      <p>Time: ${booking.startTime} - ${booking.endTime}</p>
      <p>Booked by: ${booking.name}</p>
      <button onclick="deleteBooking(${booking.id})">Cancel</button>
    </div>
  `).join('');
  
  // Refresh calendar events
  if (calendar) {
    calendar.removeAllEvents();
    calendar.addEventSource(getCalendarEvents());
  }
}

function getBookings() {
  return JSON.parse(localStorage.getItem('bookings') || '[]');
}

function deleteBooking(id) {
  const bookings = getBookings().filter(b => b.id !== id);
  localStorage.setItem('bookings', JSON.stringify(bookings));
  loadBookings();
}
