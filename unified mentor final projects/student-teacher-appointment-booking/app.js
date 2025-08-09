// 🔄 Toggle Forms
function showRegister() {
  document.getElementById("loginCard").style.display = "none";
  document.getElementById("registerCard").style.display = "block";
}

function showLogin() {
  document.getElementById("registerCard").style.display = "none";
  document.getElementById("loginCard").style.display = "block";
}

// 🔐 Register User
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = registerForm.elements[0].value;
    const email = registerForm.elements[1].value;
    const password = registerForm.elements[2].value;
    const role = registerForm.elements[3].value;

    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const uid = userCredential.user.uid;
        const userData = { name, email, role };

        const tasks = [firebase.firestore().collection("users").doc(uid).set(userData)];

        if (role === "teacher") {
          tasks.push(firebase.firestore().collection("teachers").doc(uid).set({
            name,
            email,
            subject: "Not set yet"
          }));
        }

        return Promise.all(tasks);
      })
      .then(() => {
        alert("Registration successful!");
        showLogin();
      })
      .catch((error) => {
        alert("Error: " + error.message);
      });
  });
}

// 🔓 Login User
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = loginForm.elements[0].value;
    const password = loginForm.elements[1].value;

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // ✅ Direct admin check
        if (user.email === "admin@gmail.com") { // change to your admin email
          alert("Welcome Admin!");
          window.location.href = "admin.html";
          return;
        }

        // ✅ For all others, get role from Firestore
        const uid = user.uid;
        return firebase.firestore().collection("users").doc(uid).get();
      })
      .then((doc) => {
        if (!doc || !doc.exists) {
          alert("User profile not found.");
          return;
        }

        const role = doc.data().role;
        alert(`Login successful! Redirecting to ${role} dashboard...`);

        if (role === "student") {
          window.location.href = "student.html";
        } else if (role === "teacher") {
          window.location.href = "teacher.html";
        }
      })
      .catch((error) => {
        alert("Login failed: " + error.message);
      });
  });
}



// 🔍 Student Dashboard
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const teacherListDiv = document.getElementById("teacherList");
const appointmentForm = document.getElementById("appointmentForm");
const selectedTeacherName = document.getElementById("selectedTeacherName");
let selectedTeacherId = null;

if (searchButton && teacherListDiv) {
  searchButton.addEventListener("click", async () => {
    const query = searchInput.value.trim().toLowerCase();
    teacherListDiv.innerHTML = "";

    const snapshot = await firebase.firestore().collection("teachers").get();
    let found = false;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (
        data.name.toLowerCase().includes(query) ||
        data.subject.toLowerCase().includes(query)
      ) {
        found = true;
        const div = document.createElement("div");
        div.className = "teacher-detail-card";
        div.innerHTML = `
          <strong>${data.name}</strong>
          <span>Subject: ${data.subject}</span>
          <button onclick="selectTeacher('${doc.id}', '${data.name}')">Book</button>
        `;
        teacherListDiv.appendChild(div);
      }
    });

    if (!found) {
      teacherListDiv.innerHTML = "<p>No matching teachers found.</p>";
    }
  });

  window.selectTeacher = function (id, name) {
    selectedTeacherId = id;
    selectedTeacherName.textContent = name;
    appointmentForm.style.display = "block";
  };

  window.bookAppointment = function () {
    const time = document.getElementById("appointmentTime").value;
    const message = document.getElementById("appointmentMessage").value;
    const studentId = firebase.auth().currentUser.uid;

    firebase.firestore().collection("appointments").add({
      studentId,
      teacherId: selectedTeacherId,
      time,
      message,
      status: "pending"
    }).then(() => {
      alert("Appointment request sent!");
      appointmentForm.style.display = "none";
    });
  };
}

// 👨‍🏫 Teacher Dashboard
const appointmentsList = document.getElementById("appointmentsList");
if (appointmentsList) {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      firebase.firestore().collection("appointments")
        .where("teacherId", "==", user.uid)
        .get()
        .then((snapshot) => {
          snapshot.forEach((doc) => {
            const data = doc.data();
            const div = document.createElement("div");
            div.innerHTML = `
              <p><strong>Time:</strong> ${data.time}</p>
              <p><strong>Message:</strong> ${data.message}</p>
              <p><strong>Status:</strong> ${data.status}</p>
              ${data.status === "pending" ? `<button onclick="approve('${doc.id}')">Approve</button>` : ""}
              <hr>
            `;
            appointmentsList.appendChild(div);
          });
        });
    }
  });

  window.approve = function (id) {
    firebase.firestore().collection("appointments").doc(id).update({
      status: "approved"
    }).then(() => {
      alert("Appointment approved!");
      location.reload();
    });
  };
}

// 🛠️ Admin Dashboard
const userList = document.getElementById("userList");
const allAppointments = document.getElementById("allAppointments");

if (userList && allAppointments) {
  firebase.firestore().collection("users").get().then((snapshot) => {
    snapshot.forEach((doc) => {
      const user = doc.data();
      const div = document.createElement("div");
      div.textContent = `${user.name} (${user.role})`;
      userList.appendChild(div);
    });
  });

  firebase.firestore().collection("appointments").get().then((snapshot) => {
    snapshot.forEach((doc) => {
      const data = doc.data();
      const div = document.createElement("div");
      div.innerHTML = `
        <p><strong>Student ID:</strong> ${data.studentId}</p>
        <p><strong>Teacher ID:</strong> ${data.teacherId}</p>
        <p><strong>student name:</strong> ${data.stu}
        <p><strong>Time:</strong> ${data.time}</p>
        <p><strong>Message:</strong> ${data.message}</p>
        <p><strong>Status:</strong> ${data.status}</p>
        <hr>
      `;
      allAppointments.appendChild(div);
    });
  });
}