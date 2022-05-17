const db = require('ocore/db.js');

exports.getCategoryByAddress = async function (aa_address) {
  let res;
  try {
    res = await db.query("SELECT category FROM categories WHERE category_id IN (SELECT category_id from markets WHERE aa_address=?)", [aa_address]);
    
    if (res[0]) {
      return res[0].category
    } else {
      return null
    }
  } catch (e) {
    console.error(e);
    return null;
  }
}