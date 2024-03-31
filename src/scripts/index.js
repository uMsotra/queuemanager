const firebaseConfig = {
  apiKey: "AIzaSyDSIsxreeatQd6dcuPg9RrWMvXTi1tx6ko",
  authDomain: "maliqueue.firebaseapp.com",
  databaseURL: "https://maliqueue-default-rtdb.firebaseio.com",
  projectId: "maliqueue",
  storageBucket: "maliqueue.appspot.com",
  messagingSenderId: "583905268727",
  appId: "1:583905268727:web:3a25e7f69bda40f0c354f2",
  measurementId: "G-WJW4WV0RG4"
};

  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();

  function displayQueue() {
    const queueDisplay = document.getElementById('queueDisplay');
    queueDisplay.innerHTML = ''; // Clear previous content

    const queueRef = database.ref('queue');

    // Loop through barbers and fetch queue data within the single listener
    const barbers = ['Ndumiso', 'CeeJay', 'Goat Kay', 'Ta Mjakes'];

    const emailsSent = {};

    barbers.forEach(barber => {
        const barberQueueDiv = document.createElement('div');
        barberQueueDiv.classList.add('barber-queue');

        const barberHeader = document.createElement('h2');
        barberHeader.textContent = `${barber}'s Queue`;

        const availabilitySwitch = document.createElement('input');
        availabilitySwitch.setAttribute('type', 'checkbox');
        availabilitySwitch.classList.add('availability-switch');
        availabilitySwitch.setAttribute('data-barber', barber); // Set data attribute to identify the barber

        const barberQueueList = document.createElement('ul');

        // Fetch queue data for each barber
        queueRef.orderByChild('barber').equalTo(barber).on('value', snapshot => {
            barberQueueList.innerHTML = ''; // Clear previous content

            const queueData = []; // Array to store queue data

            snapshot.forEach(childSnapshot => {
                const customerData = childSnapshot.val();
                queueData.push({ key: childSnapshot.key, ...customerData }); // Store customer data along with its key in the array
            });

            queueData.forEach((customer, index) => {
              const { key, nickname, joinedAt, whatsapp, email } = customer;
      
              // Check if the customer is now third in the queue after any removal
              if (index === 2 && !emailsSent[email]) {
                  // Send email to the customer
                  sendEmailToCustomer(email);
                  emailsSent[email] = true; // Mark email as sent
              }
                // Check if whatsapp exists before formatting the link
                const formattedWhatsApp = whatsapp ? `27${whatsapp.substring(1)}` : ''; // If whatsapp is undefined, link will be empty

                const listItem = document.createElement('li');
                listItem.classList.add('customer-card');

                listItem.innerHTML = `
                    <span class="customer-nickname">${nickname}</span> - Joined at: <span class="joined-time">${new Date(joinedAt).toLocaleString()}</span>
                    ${formattedWhatsApp ? `<a class="whatsapp-link" href="https://api.whatsapp.com/send?phone=${formattedWhatsApp}" target="_blank">WhatsApp</a>` : ''}
                    <button class="remove-button" data-key="${key}">Remove</button>
                `;

                const removeButton = listItem.querySelector('.remove-button');
                removeButton.addEventListener('click', () => {
                    // Remove the customer from the queue when the button is clicked
                    const customerKey = removeButton.getAttribute('data-key');
                    database.ref(`queue/${customerKey}`).remove();
                    listItem.remove(); // Remove the list item from the display
                });

                barberQueueList.appendChild(listItem);
            });
        });

        // Append the switch to the barberQueueDiv
        barberQueueDiv.appendChild(barberHeader);
        barberQueueDiv.appendChild(availabilitySwitch);
        barberQueueDiv.appendChild(barberQueueList);
        queueDisplay.appendChild(barberQueueDiv);

        // Event listener for the switch
        availabilitySwitch.addEventListener('change', (event) => {
            const isAvailable = event.target.checked;

            // Update the database with the new availability status
            database.ref(`barbers/${barber}`).update({
                available: isAvailable
            });
        });

        // Fetch availability status from Firebase and set the switch accordingly
        database.ref(`barbers/${barber}`).once('value', snapshot => {
            const barberData = snapshot.val();
            if (barberData) {
                const isAvailable = barberData.available || false;
                availabilitySwitch.checked = isAvailable;
            }
        });
    });
}

// Function to send email to the customer
function sendEmailToCustomer(email) {
  Email.send({
      Host: "smtp.yourisp.com", // Specify your SMTP server
      Username: "yourusername", // Specify your SMTP username
      Password: "yourpassword", // Specify your SMTP password
      To: email, // Recipient's email address
      From: "your@example.com", // Your email address
      Subject: "You're Next in Queue!", // Subject of the email
      Body: "Dear customer, you are now third in the queue. Please make your way to the barbershop.", // Body of the email
  }).then(
      message => console.log(message)
  );
}


// Call the function to display the queue when the page loads
window.onload = displayQueue;
