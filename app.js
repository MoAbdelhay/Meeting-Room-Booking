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

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBG7UBPHgxM7JSJWHjZkwjsPtbdp5eYNVc",
  authDomain: "rajeh-93f8b.firebaseapp.com",
  databaseURL: "rajeh-93f8b",
  projectId: "rajeh-93f8b",
  storageBucket: "rajeh-93f8b.firebasestorage.app",
  messagingSenderId: "1040787128859",
  appId: "1:1040787128859:web:b86ea0310cf34aea22eebe"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

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

function isBookingAvailable(newBooking) {
  const bookings = getBookings();
  const newStart = new Date(`${newBooking.date}T${newBooking.startTime}`);
  const newEnd = new Date(`${newBooking.date}T${newBooking.endTime}`);
  
  return !bookings.some(booking => {
    if (booking.date !== newBooking.date) return false;
    
    const existingStart = new Date(`${booking.date}T${booking.startTime}`);
    const existingEnd = new Date(`${booking.date}T${booking.endTime}`);
    
    return (newStart < existingEnd && newEnd > existingStart);
  });
}

function validateBooking() {
  const start = new Date(`2025-01-01T${startTimeInput.value}`);
  const end = new Date(`2025-01-01T${endTimeInput.value}`);
  
  if (start >= end) {
    alert('End time must be after start time');
    return false;
  }
  
  const proposedBooking = {
    date: dateInput.value,
    startTime: startTimeInput.value,
    endTime: endTimeInput.value,
    room: roomNameInput.value
  };
  
  if (!isBookingAvailable(proposedBooking)) {
    alert('This time slot is already booked. Please choose another time.');
    return false;
  }
  
  return true;
}

function saveBooking(booking) {
  const newBookingRef = database.ref('bookings').push();
  newBookingRef.set(booking, (error) => {
    if (error) {
      console.log('FAILED...', error);
    } else {
      console.log('SUCCESS!');
      sendEmailNotification(booking); // Add this line
    }
  });
}

function sendEmailNotification(booking) {
  const templateParams = {
    room: booking.room,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    name: booking.name,
    email: "gmom@alrajehmodern.com.sa.com" // Replace with the recipient's email address
  };

  emailjs.send('m73k12pv7qX_joeqM', 'k6Xjn0PIG8aBaUqtyZupU', templateParams)
    .then(function(response) {
       console.log('SUCCESS!', response.status, response.text);
    }, function(error) {
       console.log('FAILED...', error);
    });
}

function getBookings(callback) {
  database.ref('bookings').once('value', (snapshot) => {
    const bookings = [];
    snapshot.forEach((childSnapshot) => {
      const booking = childSnapshot.val();
      booking.id = childSnapshot.key;
      bookings.push(booking);
    });
    callback(bookings);
  });
}

function loadBookings() {
  getBookings((bookings) => {
    bookingsList.innerHTML = bookings.map(booking => `
      <div class="booking-item">
        <h3>${booking.room}</h3>
        <p>Date: ${booking.date}</p>
        <p>Time: ${booking.startTime} - ${booking.endTime}</p>
        <p>Booked by: ${booking.name}</p>
        <button onclick="deleteBooking('${booking.id}')">Cancel</button>
      </div>
    `).join('');
    
    // Refresh calendar events
    if (calendar) {
      calendar.removeAllEvents();
      calendar.addEventSource(getCalendarEvents(bookings));
    }
  });
}

function getCalendarEvents(bookings) {
  return bookings.map(booking => ({
    id: booking.id,
    title: `${booking.room} - ${booking.name}`,
    start: `${booking.date}T${booking.startTime}`,
    end: `${booking.date}T${booking.endTime}`,
    allDay: false
  }));
}

function deleteBooking(id) {
  database.ref('bookings/' + id).remove()
    .then(() => {
      loadBookings();
    })
    .catch((error) => {
      console.log('FAILED...', error);
    });
}
