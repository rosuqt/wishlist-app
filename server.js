const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseKey = process.env.SUPABASE_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey); 


const express = require('express');
const path = require('path');
const { Client } = require('pg');  
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'wishlist')));
app.use(express.json());  
app.use(cors());

const client = new Client({
  connectionString: 'postgresql://postgres.ipbjyyglslqvdrsmmcvl:Paramore867@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres', // Direct connection string (replace with environment variable if needed)
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Failed to connect to PostgreSQL', err));

// Route to serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'wishlist', 'homepage.html')); // Landing page
});

// Route to serve wishlist page
app.get('/wish.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'wishlist', 'wish.html')); // Wishlist page
});

// Route to add or update wishlist items
app.post('/addItem', (req, res) => {
  const { name, link, price, image, notes, priority, wishlistNumber, updateIndex } = req.body;

  // Validate required fields
  if (!name || !link || !price || !wishlistNumber) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) {
    return res.status(400).json({ success: false, message: "Invalid price." });
  }

  if (updateIndex !== null && updateIndex !== undefined) { // Update existing item
    // Check if the item exists in the database
    const checkExistenceQuery = `SELECT id FROM wishlist_items WHERE id = $1 AND wishlistNumber = $2`;

    client.query(checkExistenceQuery, [updateIndex, wishlistNumber])
      .then(result => {
        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Item not found for update.' });
        }

        // Proceed with updating the item
        const updateQuery = `
          UPDATE wishlist_items 
          SET name = $1, link = $2, price = $3, image = $4, notes = $5, priority = $6 
          WHERE id = $7 AND wishlistNumber = $8
        `;

        client.query(updateQuery, [
          name, link, priceNum, image, notes, priority, updateIndex, wishlistNumber
        ])
          .then(() => res.json({ success: true, message: 'Item updated successfully.' }))
          .catch(err => {
            console.error('Error updating item:', err);
            res.status(500).json({ success: false, message: 'Error updating item.' });
          });
      })
      .catch(err => {
        console.error('Error checking item existence:', err);
        res.status(500).json({ success: false, message: 'Error checking item existence.' });
      });
  } else { // Add new item
    const insertQuery = `
      INSERT INTO wishlist_items (name, link, price, image, notes, priority, wishlistNumber) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    client.query(insertQuery, [
      name, link, priceNum, image, notes, priority, wishlistNumber
    ])
      .then(() => res.json({ success: true, message: 'Item added successfully.' }))
      .catch(err => {
        console.error('Error adding item:', err);
        res.status(500).json({ success: false, message: 'Error adding item.' });
      });
  }
});

// Route to get wishlist items
app.get('/getWishlistItems/:wishlistNumber', (req, res) => {
  const wishlistNumber = req.params.wishlistNumber;

  const query = `SELECT * FROM wishlist_items WHERE wishlistNumber = $1 AND bought = false`;

  client.query(query, [wishlistNumber])
    .then(result => res.json({ success: true, items: result.rows }))
    .catch(err => {
      console.error('Error fetching items:', err);
      res.status(500).json({ success: false, message: 'Error fetching wishlist items' });
    });
});

// Route to delete an item
app.post('/deleteItem', (req, res) => {
  const { wishlistNumber, id } = req.body;

  if (!wishlistNumber || !id) {
    return res.status(400).json({ success: false, message: "Missing wishlistNumber or id" });
  }

  const query = 'DELETE FROM wishlist_items WHERE id = $1 AND wishlistNumber = $2';
  client.query(query, [id, wishlistNumber])
    .then(() => res.json({ success: true, message: 'Item deleted successfully' }))
    .catch(err => {
      console.error('Error deleting item:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    });
});

// Route to mark item as bought
app.post('/markAsBought', (req, res) => {
  const { wishlistNumber, id } = req.body;

  if (!wishlistNumber || !id) {
    return res.status(400).json({ success: false, message: 'Wishlist number or item ID not provided.' });
  }

  const query = `UPDATE wishlist_items SET bought = true WHERE id = $1 AND wishlistNumber = $2`;

  client.query(query, [id, wishlistNumber])
    .then(() => res.json({ success: true, message: 'Item marked as bought successfully.' }))
    .catch(err => {
      console.error('Error marking item as bought:', err);
      res.status(500).json({ success: false, message: 'Error marking item as bought.' });
    });
});

// Route to get bought items
app.get('/getBoughtItems/:wishlistNumber', (req, res) => {
  const wishlistNumber = req.params.wishlistNumber;

  const query = `SELECT * FROM wishlist_items WHERE wishlistNumber = $1 AND bought = true`;

  client.query(query, [wishlistNumber])
    .then(result => res.json({ success: true, items: result.rows }))
    .catch(err => {
      console.error('Error fetching bought items:', err);
      res.status(500).json({ success: false, message: 'Error fetching bought items' });
    });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
