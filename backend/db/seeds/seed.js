require('dotenv').config();
const { Client } = require('pg');

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rnd(0, arr.length - 1)];

// category: [SKU prefix, [[name, price], ...]]
const DATA = {
  Electronics: ['ELE', [
    ['Dell Inspiron 15 Laptop', 650], ['HP Pavilion 14 Laptop', 720], ['Lenovo IdeaPad 3 Laptop', 580],
    ['24-inch Full HD Monitor', 140], ['27-inch 4K Monitor', 320], ['Wireless Bluetooth Headphones', 55],
    ['Noise Cancelling Earbuds', 90], ['Portable Bluetooth Speaker', 40], ['1080p Webcam', 35],
    ['Mechanical Keyboard', 70], ['Wireless Mouse', 18], ['1TB External Hard Drive', 60],
    ['64GB USB Flash Drive', 9], ['Smart Watch Series 5', 120], ['WiFi Router AC1200', 45],
  ]],
  Mobiles: ['MOB', [
    ['Samsung Galaxy A54 128GB', 380], ['Xiaomi Redmi Note 12', 240], ['Oppo Reno 8', 420],
    ['Vivo V27', 400], ['Infinix Note 30', 190], ['Tecno Camon 20', 210], ['Realme 11 Pro', 330],
    ['Samsung Galaxy S23', 850], ['Google Pixel 7a', 450], ['Nokia G42', 200],
    ['Tempered Glass Screen Protector', 4], ['33W Fast Charger', 15], ['USB-C Cable 1m', 5],
    ['Power Bank 10000mAh', 22], ['Silicone Phone Back Cover', 6],
  ]],
  Grocery: ['GRO', [
    ['Basmati Rice 5kg', 12], ['Wheat Flour 10kg', 9], ['White Sugar 5kg', 6], ['Tea Leaves 950g', 11],
    ['Cooking Oil 5L', 14], ['Red Lentils 1kg', 3], ['Chickpeas 1kg', 3], ['Red Chilli Powder 500g', 4],
    ['Turmeric Powder 200g', 2], ['Iodized Salt 800g', 1], ['Full Cream Milk Powder 900g', 10],
    ['Family Pack Biscuits', 3], ['Instant Noodles Pack of 5', 3], ['Pure Honey 500g', 9], ['Green Tea 100 Bags', 6],
  ]],
  Clothing: ['CLO', [
    ['Cotton T-Shirt Men', 12], ['Slim Fit Jeans', 28], ['Denim Jacket', 45], ['Pullover Hoodie', 32],
    ['Cotton Kurta', 25], ['Wool Shawl', 30], ['Formal Shirt', 22], ["Women's Lawn Suit", 35],
    ['Winter Sweater', 28], ['Track Pants', 18], ['Polo Shirt', 16], ['Socks Pack of 6', 8],
    ['Baseball Cap', 10], ['Winter Gloves', 9], ['Kids T-Shirt', 8],
  ]],
  Footwear: ['FOO', [
    ['Running Shoes', 48], ['Leather Formal Shoes', 55], ['Casual Sneakers', 40], ['Sports Sandals', 20],
    ['Peshawari Chappal', 25], ['Kids School Shoes', 22], ['Slip-on Loafers', 38], ['Hiking Boots', 70],
    ['Flip Flops', 6], ["Women's Heels", 35], ['Canvas Shoes', 24], ['Football Boots', 45],
    ['Leather Boots', 65], ['House Slippers', 8], ['Walking Shoes', 42],
  ]],
  Accessories: ['ACC', [
    ['Leather Wallet', 15], ['Leather Belt', 12], ['Laptop Backpack', 30], ['Polarized Sunglasses', 20],
    ['Analog Wrist Watch', 40], ['Travel Duffel Bag', 35], ['Silk Scarf', 14], ['Ladies Handbag', 38],
    ['Metal Keychain', 3], ['Folding Umbrella', 10], ['Leather Watch Strap', 8], ['Card Holder', 9],
    ['Tie Set', 16], ['Hair Accessories Set', 5], ['Travel Neck Pillow', 11],
  ]],
  Furniture: ['FUR', [
    ['Ergonomic Office Chair', 95], ['Study Table', 80], ['Wooden Bookshelf', 110], ['3-Seater Sofa', 420],
    ['Queen Bed Frame', 350], ['6-Seater Dining Table', 480], ['LED Desk Lamp', 18], ['Shoe Rack', 40],
    ['2-Door Wardrobe', 260], ['Coffee Table', 85], ['TV Console', 150], ['Bedside Table', 45],
    ['Folding Chair', 22], ['Bean Bag', 38], ['Wall Mirror', 30],
  ]],
  Stationery: ['STA', [
    ['A4 Notebook 200 Pages', 3], ['Gel Pen Set of 10', 4], ['Permanent Markers Pack', 5],
    ['File Folder Pack', 6], ['Heavy Duty Stapler', 4], ['Scientific Calculator', 14],
    ['A4 Paper Ream 500 Sheets', 7], ['Sticky Notes Pack', 3], ['Highlighters Set', 4],
    ['Geometry Box', 5], ['Whiteboard 2x3 ft', 25], ['Whiteboard Markers', 5],
    ['Desk Organizer', 11], ['Glue Sticks Pack', 3], ['A3 Sketch Pad', 6],
  ]],
  Sports: ['SPO', [
    ['Football Size 5', 15], ['English Willow Cricket Bat', 85], ['Cricket Ball Pack of 6', 12],
    ['Yoga Mat', 15], ['Dumbbell Set 10kg', 40], ['Skipping Rope', 5], ['Badminton Racket Pair', 28],
    ['Shuttlecock Pack', 6], ['Tennis Ball Pack', 8], ['Gym Gloves', 10], ['Resistance Bands Set', 14],
    ['Sports Water Bottle', 7], ['Basketball', 20], ['Boxing Gloves', 30], ['Table Tennis Set', 25],
  ]],
  'Home Appliances': ['HOM', [
    ['3-Speed Blender', 35], ['Electric Iron', 25], ['Ceiling Fan', 55], ['Electric Kettle', 22],
    ['Microwave Oven', 130], ['Air Fryer', 80], ['Rice Cooker', 40], ['Vacuum Cleaner', 90],
    ['Water Dispenser', 120], ['Hair Dryer', 20], ['Pop-up Toaster', 28], ['Fruit Juicer', 45],
    ['Room Heater', 50], ['Sandwich Maker', 24], ['Induction Cooker', 60],
  ]],
};

const CITIES = ['Hazro', 'Attock', 'Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Multan', 'Faisalabad', 'Quetta'];

(async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await client.connect();

  try {
    await client.query('BEGIN');

    // 1. Purana SEED-xxxxx (5000 wala) data saaf
    await client.query("DELETE FROM inventory_history WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'SEED-%')");
    const old = await client.query("DELETE FROM products WHERE sku LIKE 'SEED-%'");
    await client.query("DELETE FROM categories WHERE name = 'Home' AND id NOT IN (SELECT category_id FROM products WHERE category_id IS NOT NULL)");
    console.log(`Old seed products removed: ${old.rowCount}`);

    // 2. Categories
    const catIds = {};
    for (const name of Object.keys(DATA)) {
      const r = await client.query(
        `INSERT INTO categories (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [name]);
      catIds[name] = r.rows[0].id;
    }

    // 3. Suppliers
    const supplierIds = [];
    for (let i = 0; i < CITIES.length; i++) {
      const r = await client.query(
        `INSERT INTO suppliers (name, email, phone, address) VALUES ($1,$2,$3,$4)
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`,
        [`${CITIES[i]} Traders`, `seed.supplier${i + 1}@example.com`, `0300-${1000000 + i * 1111}`, `${CITIES[i]}, Pakistan`]);
      supplierIds.push(r.rows[0].id);
    }

    // 4. Products
    let added = 0;
    for (const [catName, [prefix, items]] of Object.entries(DATA)) {
      for (let i = 0; i < items.length; i++) {
        const [name, price] = items[i];
        const sku = `${prefix}-${String(i + 1).padStart(3, '0')}`;

        const roll = Math.random();
        const initial = roll < 0.08 ? 0 : roll < 0.25 ? rnd(1, 9) : rnd(20, 200);
        const out = initial >= 20 && Math.random() < 0.6 ? rnd(1, Math.floor(initial / 2)) : 0;
        const qty = initial - out;

        const p = await client.query(
          `INSERT INTO products (sku, name, description, price, category_id, quantity, reorder_level)
           VALUES ($1,$2,$3,$4,$5,$6,10) ON CONFLICT (sku) DO NOTHING RETURNING id`,
          [sku, name, `${name} - ${catName}`, price, catIds[catName], qty]);
        if (!p.rowCount) continue; // pehle se hai (aur uski image safe rahegi)
        const pid = p.rows[0].id;
        added++;

        for (const sid of new Set([pick(supplierIds), pick(supplierIds)])) {
          await client.query(
            'INSERT INTO product_suppliers (product_id, supplier_id, supply_price) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            [pid, sid, (price * 0.8).toFixed(2)]);
        }

        const ago = (d) => new Date(Date.now() - d * 86400000 - rnd(0, 86400000)).toISOString();
        if (initial > 0) {
          await client.query(
            `INSERT INTO inventory_history (product_id, change_type, quantity_change, quantity_after, reason, created_at)
             VALUES ($1,'IN',$2,$2,'Initial stock',$3)`, [pid, initial, ago(rnd(15, 60))]);
        }
        if (out > 0) {
          await client.query(
            `INSERT INTO inventory_history (product_id, change_type, quantity_change, quantity_after, reason, created_at)
             VALUES ($1,'OUT',$2,$3,$4,$5)`,
            [pid, -out, qty, pick(['Sale', 'Order shipped', 'Damaged']), ago(rnd(0, 14))]);
        }
      }
    }

    await client.query('COMMIT');
    console.log(`Done. New products added: ${added}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();