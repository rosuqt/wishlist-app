import express from 'express'; // Using ES6 imports
import path from 'path';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Use the environment variable for allowed frontend URL(s)
const allowedOrigins = [process.env.FRONTEND_URL]; // Add the frontend URL(s) here

// Configure CORS to allow only the allowed frontend URLs
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);  // Allow the request
    } else {
      callback(new Error('Not allowed by CORS'));  // Block the request
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));  // Apply CORS middleware

app.use(express.static(path.join(__dirname, 'wishlist')));
app.use(express.json());

// API routes

app.get('/getWishlistItems/:wishlistNumber', async (req, res) => {
  const wishlistNumber = req.params.wishlistNumber;

  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('wishlistNumber', wishlistNumber)
    .eq('bought', false);

  if (error) {
    console.error('Error fetching wishlist items:', error);
    return res.status(500).json({ success: false, message: 'Error fetching wishlist items' });
  }

  res.json({ success: true, items: data });
});

app.post('/addItem', async (req, res) => {
  const { name, link, price, image, notes, priority, wishlistNumber, updateIndex } = req.body;

  if (!name || !link || !price || !wishlistNumber) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) {
    return res.status(400).json({ success: false, message: "Invalid price." });
  }

  if (updateIndex !== null && updateIndex !== undefined) {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('id', updateIndex)
      .eq('wishlistNumber', wishlistNumber);

    if (error || data.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found for update.' });
    }

    const { error: updateError } = await supabase
      .from('wishlist_items')
      .update({ name, link, price: priceNum, image, notes, priority })
      .eq('id', updateIndex)
      .eq('wishlistNumber', wishlistNumber);

    if (updateError) {
      console.error('Error updating item:', updateError);
      return res.status(500).json({ success: false, message: 'Error updating item.' });
    }

    return res.json({ success: true, message: 'Item updated successfully.' });
  } else {
    const { data, error } = await supabase
      .from('wishlist_items')
      .insert([{ name, link, price: priceNum, image, notes, priority, wishlistNumber }]);

    if (error) {
      console.error('Error adding item:', error);
      return res.status(500).json({ success: false, message: 'Error adding item.' });
    }

    res.json({ success: true, message: 'Item added successfully.' });
  }
});

app.post('/deleteItem', async (req, res) => {
  const { wishlistNumber, id } = req.body;

  const { data, error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', id)
    .eq('wishlistNumber', wishlistNumber);

  if (error) {
    console.error('Error deleting item:', error);
    return res.status(500).json({ success: false, message: 'Error deleting item' });
  }

  res.json({ success: true, message: 'Item deleted successfully.' });
});

app.post('/markAsBought', async (req, res) => {
  const { wishlistNumber, id } = req.body;

  const { error } = await supabase
    .from('wishlist_items')
    .update({ bought: true })
    .eq('id', id)
    .eq('wishlistNumber', wishlistNumber);

  if (error) {
    console.error('Error marking item as bought:', error);
    return res.status(500).json({ success: false, message: 'Error marking item as bought' });
  }

  res.json({ success: true, message: 'Item marked as bought.' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${port}`);
});