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
        return firebase.firestore().collection("users").doc(uid).set(userData);
      })
      .then(() => {
        alert("Registration successful! You can now log in.");
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
        const uid = user.uid;
        return firebase.firestore().collection("users").doc(uid).get();
      })
      .then((doc) => {
        if (!doc.exists) {
          alert("Login successful, but user profile not found. Please contact support.");
          return;
        }

        const role = doc.data().role;
        alert(`Login successful! Redirecting to ${role} dashboard...`);

        if (role === "user") {
          window.location.href = "user.html";
        } else if (role === "admin") {
          window.location.href = "admin.html";
        }
      })
      .catch((error) => {
        alert("Login failed: " + error.message);
      });
  });
}

// 👩‍🍳 Admin Dashboard
const productForm = document.getElementById("productForm");
const allProductsDiv = document.getElementById("allProducts");
const allOrdersDiv = document.getElementById("allOrders");

if (productForm && allProductsDiv && allOrdersDiv) {
  productForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const productName = document.getElementById("productName").value;
    const productPrice = document.getElementById("productPrice").value;

    firebase.firestore().collection("products").add({
      name: productName,
      price: parseFloat(productPrice)
    }).then(() => {
      alert("Product added successfully!");
      productForm.reset();
      loadAllProducts();
    }).catch((error) => {
      alert("Error adding product: " + error.message);
    });
  });

  const loadAllProducts = () => {
    allProductsDiv.innerHTML = '';
    firebase.firestore().collection("products").get().then((snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const div = document.createElement("div");
        div.className = "product-item";
        div.innerHTML = `
          <strong>${data.name}</strong> - $${data.price}
          <button onclick="removeProduct('${doc.id}')">Remove</button>
        `;
        allProductsDiv.appendChild(div);
      });
    });
  };
  
  // New function to remove a product
  window.removeProduct = (productId) => {
      firebase.firestore().collection("products").doc(productId).delete().then(() => {
          alert("Product removed successfully!");
          loadAllProducts();
      }).catch((error) => {
          alert("Error removing product: " + error.message);
      });
  };

  const loadAllOrders = () => {
    allOrdersDiv.innerHTML = '';
    firebase.firestore().collection("orders").get().then((snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const div = document.createElement("div");
        div.className = "order-item";
        div.innerHTML = `
          <p><strong>User ID:</strong> ${data.userId}</p>
          <p><strong>Total:</strong> $${data.total}</p>
          <p><strong>Status:</strong> ${data.status === 'pending' ? '<span style="color: red;">Pending</span>' : '<span style="color: green;">Confirmed</span>'}</p>
          <p><strong>Products:</strong></p>
          <ul>
            ${data.items.map(item => `<li>${item.name} ($${item.price}) x ${item.quantity}</li>`).join('')}
          </ul>
          ${data.status === 'pending' ? `<button onclick="confirmOrder('${doc.id}')">Confirm Order</button>` : ''}
          <hr>
        `;
        allOrdersDiv.appendChild(div);
      });
    });
  };

  // New function to confirm an order
  window.confirmOrder = (orderId) => {
    firebase.firestore().collection("orders").doc(orderId).update({
      status: "confirmed"
    }).then(() => {
      alert("Order confirmed!");
      loadAllOrders(); // Reload the orders to update the status on the page
    }).catch((error) => {
      alert("Error confirming order: " + error.message);
    });
  };

  loadAllProducts();
  loadAllOrders();
}

// 🛒 User Dashboard
const productListDiv = document.getElementById("productList");
const cartListDiv = document.getElementById("cartList");
const cartTotalSpan = document.getElementById("cartTotal");
const placeOrderButton = document.getElementById("placeOrderButton");
const orderListDiv = document.getElementById("orderList");

let cart = [];

if (productListDiv && cartListDiv) {
  const loadProducts = () => {
    productListDiv.innerHTML = '';
    firebase.firestore().collection("products").get().then((snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const div = document.createElement("div");
        div.innerHTML = `
          <strong>${data.name}</strong> - $${data.price}
          <button onclick="addToCart('${doc.id}', '${data.name}', ${data.price})">Add to Cart</button>
        `;
        productListDiv.appendChild(div);
      });
    });
  };

  window.addToCart = (id, name, price) => {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ id, name, price, quantity: 1 });
    }
    renderCart();
  };

  const renderCart = () => {
    cartListDiv.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
      const div = document.createElement("div");
      div.innerHTML = `
        ${item.name} - $${item.price} x ${item.quantity}
      `;
      cartListDiv.appendChild(div);
      total += item.price * item.quantity;
    });
    cartTotalSpan.textContent = total.toFixed(2);
  };

  placeOrderButton.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const userId = firebase.auth().currentUser.uid;
    const total = parseFloat(cartTotalSpan.textContent);

    firebase.firestore().collection("orders").add({
      userId,
      items: cart,
      total,
      status: "pending",
      createdAt: new Date()
    }).then(() => {
      alert("Order placed successfully!");
      cart = [];
      renderCart();
      loadOrders();
    }).catch((error) => {
      alert("Error placing order: " + error.message);
    });
  });

  const loadOrders = () => {
    orderListDiv.innerHTML = '';
    const userId = firebase.auth().currentUser.uid;
    firebase.firestore().collection("orders")
      .where("userId", "==", userId)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          const div = document.createElement("div");
          div.innerHTML = `
            <p><strong>Total:</strong> $${data.total}</p>
            <p><strong>Status:</strong> ${data.status === 'pending' ? 'Pending' : 'Confirmed'}</p>
            <hr>
          `;
          orderListDiv.appendChild(div);
        });
      });
  };

  loadProducts();
  loadOrders();
}