require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseKey = process.env.SUPABASE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.static(path.join(__dirname, 'wishlist')));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'wishlist', 'homepage.html'));
});

app.get('/wish.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'wishlist', 'wish.html'));
});

app.post('/addItem', async (req, res) => {
  const { name, link, price, image, notes, priority, wishlistNumber, updateIndex, brand } = req.body;

  console.log('Received data:', { name, link, price, image, notes, priority, wishlistNumber, updateIndex, brand }); 

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
      .update({ name, link, price: priceNum, image, notes, priority, brand })
      .eq('id', updateIndex)
      .eq('wishlistNumber', wishlistNumber);

    if (updateError) {
      return res.status(500).json({ success: false, message: 'Error updating item.' });
    }

    return res.json({ success: true, message: 'Item updated successfully.' });
  } else {
    const { error } = await supabase
      .from('wishlist_items')
      .insert([{ name, link, price: priceNum, image, notes, priority, wishlistNumber, brand }]);

    if (error) {
      return res.status(500).json({ success: false, message: 'Error adding item.' });
    }

    res.json({ success: true, message: 'Item added successfully.' });
  }
});


app.get('/getWishlistItems/:wishlistNumber', async (req, res) => {
  const wishlistNumber = req.params.wishlistNumber;

  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('wishlistNumber', wishlistNumber)
    .eq('bought', false);

  if (error) {
    return res.status(500).json({ success: false, message: 'Error fetching wishlist items' });
  }

  res.json({ success: true, items: data });
});

app.post('/deleteItem', async (req, res) => {
  const { wishlistNumber, id } = req.body;

  if (!wishlistNumber || !id) {
    return res.status(400).json({ success: false, message: "Missing wishlistNumber or id" });
  }

  const { data, error: findError } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('id', id)
    .eq('wishlistNumber', wishlistNumber);

  if (findError || data.length === 0) {
    return res.status(404).json({ success: false, message: "Item not found" });
  }

  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', id)
    .eq('wishlistNumber', wishlistNumber);

  if (error) {
    return res.status(500).json({ success: false, message: 'Error deleting item' });
  }

  res.json({ success: true, message: 'Item deleted successfully' });
});

app.post('/markAsBought', async (req, res) => {
  const { wishlistNumber, id } = req.body;

  if (!wishlistNumber || !id) {
    return res.status(400).json({ success: false, message: 'Wishlist number or item ID not provided.' });
  }

  const { error } = await supabase
    .from('wishlist_items')
    .update({ bought: true })
    .eq('id', id)
    .eq('wishlistNumber', wishlistNumber);

  if (error) {
    return res.status(500).json({ success: false, message: 'Error marking item as bought.' });
  }

  res.json({ success: true, message: 'Item marked as bought successfully.' });
});

app.post('/updateBoughtStatus', async (req, res) => {
  const { wishlistNumber, itemId, bought } = req.body;

  if (!wishlistNumber || !itemId) {
    return res.status(400).json({ success: false, message: 'Wishlist number or item ID not provided.' });
  }

  const { error } = await supabase
    .from('wishlist_items')
    .update({ bought })
    .eq('id', itemId)
    .eq('wishlistNumber', wishlistNumber);

  if (error) {
    return res.status(500).json({ success: false, message: 'Database update failed' });
  }

  res.json({ success: true, message: 'Item moved back to wishlist' });
});


app.get('/getBoughtItems/:wishlistNumber', async (req, res) => {
  const wishlistNumber = req.params.wishlistNumber;

  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('wishlistNumber', wishlistNumber)
    .eq('bought', true);

  if (error) {
    return res.status(500).json({ success: false, message: 'Error fetching bought items' });
  }

  res.json({ success: true, items: data });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
