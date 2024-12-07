import dotenv from 'dotenv';
dotenv.config();

const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const backendUrl = process.env.BACKEND_URL || 'https://wishlist-backend.vercel.app';

const corsOptions = {
  origin: '*', 
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, 'wishlist')));
app.use(express.json());

function changeText(button, newText) {
    button.style.opacity = 0;

    setTimeout(() => {
        button.textContent = newText;
        button.style.opacity = 1;
    }, 200);
}

function resetText(button, originalText) {
    button.style.opacity = 0;

    setTimeout(() => {
        button.textContent = originalText;
        button.style.opacity = 1;
    }, 200);
}

const wishlists = {
    1: [],
    2: []
};

function showWishlist(wishlistNumber) {
    const container = document.getElementById("wishlistContainer");
    container.innerHTML = `
        <h2>
            Wishlist ${wishlistNumber} 
            <span class="already-bought-link" onclick="viewAlreadyBought(${wishlistNumber})">
                View Bought Items
            </span>
        </h2>
    `;

    const items = wishlists[wishlistNumber];

    if (items && items.length === 0) {
        container.innerHTML += `
            <img src="https://media.giphy.com/media/leuNkvf9pE6loEnjnb/giphy.gif" alt="Loading..." class="loading-image" />
            <p class="loading-text">It’s Empty (◞‸ ◟)💧...</p>`;
    } else {
        items.forEach((item, index) => {
            const itemElement = document.createElement("div");
            itemElement.className = "wishlistItem";
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div>
                    <h3><span>${item.name}</span></h3>
                    <p><span>Price: PHP ${item.price}</span></p>
                    <p><span>Priority: ${item.priority || "None"}</span></p>
                    <p><span>Notes: ${item.notes || "No notes provided."}</span></p>
                    <a href="${item.link}" target="_blank"><span>View Product</span></a>
                    <div class="action-buttons">
                        <button onclick="markAsBought(${wishlistNumber}, ${index})">
                            ${item.bought ? "Bought ✔️" : "Mark as Bought"}
                        </button>
                        <button onclick="editItem(${wishlistNumber}, ${index})">Edit</button>
                        <button onclick="deleteItem(${wishlistNumber}, ${index})">Delete</button>
                    </div>
                </div>
            `;
            container.appendChild(itemElement);
        });
    }

    const addButton = document.createElement("button");
    addButton.textContent = "Add Item";
    addButton.onclick = () => openAddItemForm(wishlistNumber);
    container.appendChild(addButton);
}

function fetchWishlistData(wishlistNumber) {
    fetch(`${backendUrl}/getWishlistItems/${wishlistNumber}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                wishlists[wishlistNumber] = data.items;
                showWishlist(wishlistNumber);
            } else {
                alert("Failed to fetch wishlist items");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred while fetching the wishlist");
        });
}

function addOrUpdateItem(event) {
    event.preventDefault();

    const productData = {
        name: document.getElementById("productName").value,
        link: document.getElementById("productLink").value,
        price: document.getElementById("productPrice").value,
        image: document.getElementById("productImage").value,
        notes: document.getElementById("productNotes").value,
        priority: document.getElementById("productPriority").value,
        wishlistNumber: parseInt(document.getElementById("wishlistNumber").value),
        updateIndex: document.getElementById("updateIndex").value || null
    };

    fetch(`${backendUrl}/api/addItem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                closeAddItemForm();
                fetchWishlistData(productData.wishlistNumber);
            } else {
                alert('Failed to add/update item: ' + data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred while processing the request.");
        });
}

function deleteItem(wishlistNumber, itemIndex) {
    const item = wishlists[wishlistNumber][itemIndex];

    fetch(`${backendUrl}/api/deleteItem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishlistNumber, id: item.id })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fetchWishlistData(wishlistNumber);
            } else {
                alert("Failed to delete item: " + data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred while deleting the item.");
        });
}

function markAsBought(wishlistNumber, itemIndex) {
    const item = wishlists[wishlistNumber][itemIndex];

    fetch(`${backendUrl}/api/markAsBought`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishlistNumber, id: item.id })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fetchWishlistData(wishlistNumber);
            } else {
                alert("Failed to mark item as bought: " + data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred while marking the item as bought.");
        });
}

function viewAlreadyBought(wishlistNumber) {
    fetch(`${backendUrl}/api/getBoughtItems/${wishlistNumber}`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById("wishlistContainer");
            container.innerHTML = `<h2>Wishlist ${wishlistNumber} - Already Bought Items</h2>`;

            if (data.items && data.items.length === 0) {
                container.innerHTML += `
                    <p class="loading-text">No items have been bought yet!</p>`;
            } else {
                data.items.forEach(item => {
                    const itemElement = document.createElement("div");
                    itemElement.className = "wishlistItem";
                    itemElement.innerHTML = `
                        <img src="${item.image}" alt="${item.name}">
                        <div>
                            <h3>${item.name}</h3>
                            <p>Price: PHP ${item.price}</p>
                            <p>Priority: ${item.priority || "None"}</p>
                            <p>Notes: ${item.notes || "No notes provided."}</p>
                            <a href="${item.link}" target="_blank">View Product</a>
                        </div>
                    `;
                    container.appendChild(itemElement);
                });
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred while fetching bought items.");
        });
}

function closeAddItemForm() {
    document.getElementById("addItemForm").style.display = "none";
}

window.onload = function () {
    const params = new URLSearchParams(window.location.search);
    const wishlistNumber = params.get('wishlist');
    if (wishlistNumber == '1') {
        fetchWishlistData(1);
    } else if (wishlistNumber == '2') {
        fetchWishlistData(2);
    } else {
        document.getElementById("wishlistContainer").innerHTML = `
            <p class="loading-text">No wishlist selected!</p>`;
    }
};