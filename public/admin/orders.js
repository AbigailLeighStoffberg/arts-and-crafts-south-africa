// orders.js

import { db } from './firebase.js'; // Adjust the path if necessary
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadOrders() {
    console.log("Loading orders...");
    const ordersList = document.getElementById("orders-list");
    ordersList.innerHTML = "Loading orders...";

    try {
        const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        let ordersHtml = '';
        if (querySnapshot.empty) {
            ordersList.innerHTML = "No orders found.";
            return;
        }

        querySnapshot.forEach((doc) => {
            const order = doc.data();
            ordersHtml += `
                <div class="order-card">
                    <h3>Order ID: ${order.orderId}</h3>
                    <p><strong>Customer:</strong> ${order.firstName} ${order.lastName}</p>
                    <p><strong>Email:</strong> ${order.email}</p>
                    <p><strong>Total:</strong> R${order.total}</p>
                    <p><strong>Date:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
                    <details>
                        <summary>View Details</summary>
                        <pre>${order.cartItems}</pre>
                        <p><strong>Shipping:</strong> R${order.shipping}</p>
                        <p><strong>Notes:</strong> ${order.notes || 'N/A'}</p>
                        <p><strong>Address:</strong> ${order.address1}, ${order.city}, ${order.postalCode}, ${order.country}</p>
                    </details>
                </div>
            `;
        });

        ordersList.innerHTML = ordersHtml;

    } catch (e) {
        console.error("Error loading orders: ", e);
        ordersList.innerHTML = "Error loading orders.";
    }
}

export { loadOrders };