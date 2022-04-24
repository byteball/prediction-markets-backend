const db = require('ocore/db.js');

exports.updateCategory = async function (aa_address, category) {
  const lowCategory = String(category).toLowerCase().trim();
  let id;

  const rows = await db.query("SELECT * FROM categories WHERE name=?", [lowCategory]);

  if (!rows[0]){
    const res = await db.query("INSERT INTO categories (name) VALUES (?)", [lowCategory]);
    id = res.insertId;
  } else {
    id = rows[0].category_id;
  }

  

  if (id !== undefined && aa_address){
    await db.query("INSERT INTO market_categories (category_id, aa_address) VALUES (?, ?)", [id, aa_address]);
  }
  
  console.log('reg NEW NEW NEW NEW')
}