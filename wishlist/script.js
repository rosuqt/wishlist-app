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
    <p class="loading-text">Its Empty (◞‸ ◟)💧...</p>`;

    } else {
        items.forEach((item, index) => {
            const itemElement = document.createElement("div");
            itemElement.className = "wishlistItem";
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div>
                    <h3><span>${item.name}</span></h3>
                    <p>Brand: ${item.brand || "No brand specified"}</p>
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
    fetch(`/getWishlistItems/${wishlistNumber}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                wishlists[wishlistNumber] = data.items;
                showWishlist(wishlistNumber);
            } else {
                alert('Failed to fetch wishlist items');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching the wishlist');
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
        brand: document.getElementById("productBrand").value,
        wishlistNumber: parseInt(document.getElementById("wishlistNumber").value), 
        updateIndex: document.getElementById("updateIndex").value || null 
    };

    console.log("Product Data being sent:", productData);
    
    fetch('/addItem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Server response:', data);  
        if (data.success) {
            showResponseBox('Item added/updated successfully!', 'Item added/updated successfully!');
            closeAddItemForm(); 
            fetchWishlistData(productData.wishlistNumber);  
        } else {
            showResponseBox('Failed to add/update item: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showResponseBox('An error occurred while processing the request.', 'error');
    });
}

function openAddItemForm(wishlistNumber) {
    const form = document.getElementById("addItemForm");
    form.style.display = "block";
    document.getElementById("wishlistNumber").value = wishlistNumber;
    document.getElementById("updateIndex").value = "";  
    document.getElementById("productName").value = "";
    document.getElementById("productLink").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productImage").value = "";
    document.getElementById("productNotes").value = "";
    document.getElementById("productPriority").value = "";
    document.getElementById("productBrand").value = "";
    
    
}

function editItem(wishlistNumber, itemIndex) {
    const item = wishlists[wishlistNumber][itemIndex];
    if (!item) {
        showResponseBox('error', "Item not found for editing.");
        return;
    }

    openAddItemForm(wishlistNumber);

    document.getElementById("productName").value = item.name;
    document.getElementById("productBrand").value = item.brand || "Unknown";
    document.getElementById("productLink").value = item.link;
    document.getElementById("productPrice").value = item.price;
    document.getElementById("productImage").value = item.image;
    document.getElementById("productNotes").value = item.notes || "";
    document.getElementById("productPriority").value = item.priority || "";
    document.getElementById("updateIndex").value = item.id; 
}

function deleteItem(wishlistNumber, itemIndex) {
    const item = wishlists[wishlistNumber][itemIndex];
    console.log("Deleting item:", item);

    if (!item || !item.id) {
        showResponseBox('error', "Item not found or missing ID for deletion.");
        return;
    }

    fetch('/deleteItem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishlistNumber, id: item.id }), 
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showResponseBox('success', data.message);
            fetchWishlistData(wishlistNumber); 
        } else {
            showResponseBox('error', data.message);
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        showResponseBox('error', "An error occurred while deleting the item.");
    });
}

function markAsBought(wishlistNumber, itemIndex) {
    const item = wishlists[wishlistNumber][itemIndex];
    console.log("Marking as bought item:", item);

    if (!item || !item.id) {
        showResponseBox('error', "Item not found or missing ID for marking as bought.");
        return;
    }

    fetch('/markAsBought', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishlistNumber, id: item.id }), 
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showResponseBox('success', data.message);
            fetchWishlistData(wishlistNumber);  
        } else {
            showResponseBox('error', data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showResponseBox('error', "An error occurred while marking the item as bought.");
    });
}



function viewAlreadyBought(wishlistNumber) {
    fetch(`/getBoughtItems/${wishlistNumber}`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById("wishlistContainer");

            container.innerHTML = ''; 

            const header = document.createElement('h2');
            header.innerHTML = `Wishlist ${wishlistNumber}  𖹭  Already Bought
                <span class="already-bought-link" onclick="showWishlist(${wishlistNumber})">
                    Back to Wishlist <<
                </span>
            `;
            container.appendChild(header);

            if (data.items && data.items.length === 0) {
                const noItemsMessage = document.createElement('p');
                noItemsMessage.className = 'loading-text';
                noItemsMessage.innerHTML = 'Its Empty (◞‸ ◟)💧...';
                container.appendChild(noItemsMessage);

                const loadingImage = document.createElement('img');
                loadingImage.src = 'waiting.webp';
                loadingImage.alt = 'Loading...';
                loadingImage.className = 'loading-image';
                container.appendChild(loadingImage);
            } else {
                data.items.forEach(item => {
                    const itemElement = document.createElement("div");
                    itemElement.className = "wishlistItem";
                    itemElement.innerHTML = `
                        <img src="${item.image}" alt="${item.name}">
                        <div>
                            <h3>${item.name}</h3>
                            <p>Brand: ${item.brand || "No brand specified"}</p>
                            <p>Price: PHP ${item.price}</p>
                            <p>Priority: ${item.priority || "None"}</p>
                            <p>Notes: ${item.notes || "No notes provided."}</p>
                            <a href="${item.link}" target="_blank">View Product</a>
                            <button onclick="moveBackToWishlist(${wishlistNumber}, ${item.id})">
                                Move Back ↺
                            </button>
                        </div>
                    `;
                    container.appendChild(itemElement);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching bought items.');
        });
}

function moveBackToWishlist(wishlistNumber, itemId) {
    fetch(`/updateBoughtStatus`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            wishlistNumber: wishlistNumber, 
            itemId: itemId,                
            bought: false                 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Item successfully moved back');
            showResponseBox('success', 'Item moved back to wishlist successfully!'); 

            
            viewAlreadyBought(wishlistNumber);
            fetch(`/getWishlistItems/${wishlistNumber}`)
            .then(response => response.json())
            .then(wishlistData => {
                if (wishlistData.success) {
                    wishlists[wishlistNumber] = wishlistData.items; // Update local wishlist data
                } else {
                    console.error('Failed to fetch wishlist data:', wishlistData.message);
                }
            })
            .catch(error => {
                console.error('Error fetching wishlist data:', error);
            });

    } else {
        console.error('Failed to move item back:', data.message);
        showResponseBox('error', 'Failed to move item back. Please try again later.');
    }
})
.catch((error) => {
    console.error('Error:', error);
    showResponseBox('error', 'An error occurred while moving the item back to the wishlist.');
});
}

function closeAddItemForm() {
    document.getElementById("addItemForm").style.display = "none";
}

window.onload = function() {
    const params = new URLSearchParams(window.location.search);
    const wishlistNumber = params.get('wishlist');
    if (wishlistNumber == '1') {
        fetchWishlistData(1);
    } else if (wishlistNumber == '2') {
        fetchWishlistData(2);
    } else {
        document.getElementById("wishlistContainer").innerHTML = `
    <img src="waiting.webp" alt="Loading..." class="loading-image" />
    <p class="loading-text">Its Empty (◞‸ ◟)💧...</p>`;
    }
};

function showResponseBox(status, message, data) {
    const responseBox = document.getElementById('responseBox');
    const statusElement = document.getElementById('status');
    const messageElement = document.getElementById('message');
    const countdownElement = document.getElementById('countdown');
    const closeBtn = document.getElementById('closeBtn');
    const okBtn = document.getElementById('okBtn');
    
    messageElement.textContent = message;
    countdownElement.textContent = '5';

    if (status === 'error') {
        document.getElementById('responseHeader').classList.add('errorHeader');
        document.getElementById('responseHeader').classList.remove('successHeader');
        statusElement.textContent = 'Error';
    } else {
        document.getElementById('responseHeader').classList.add('successHeader');
        document.getElementById('responseHeader').classList.remove('errorHeader');
        statusElement.textContent = 'Success';
    }

    responseBox.style.display = 'block';

    let countdownValue = 3;
    const countdownInterval = setInterval(() => {
        countdownValue--;
        countdownElement.textContent = countdownValue;

        if (countdownValue === 0) {
            clearInterval(countdownInterval);
            responseBox.style.display = 'none';
        }
    }, 1000);

    closeBtn.addEventListener('click', () => {
        clearInterval(countdownInterval);
        responseBox.style.display = 'none';
    });

    okBtn.addEventListener('click', () => {
        clearInterval(countdownInterval);
        responseBox.style.display = 'none';
    });
}

const okBtn = document.getElementById('okBtn');

okBtn.addEventListener('mouseenter', () => {
    okBtn.textContent = '(^▽^)👍';
});

okBtn.addEventListener('mouseleave', () => {
    okBtn.textContent = 'OK';
});



  