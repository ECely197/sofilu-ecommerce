const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://sofilu-user:sofi12345@sofilucluster.pwtry2x.mongodb.net/?retryWrites=true&w=majority&appName=SofiluCluster";

mongoose.connect(mongoUri)
  .then(async () => {
    console.log("Connected to MongoDB successfully");
    
    const Category = mongoose.model('Category', new mongoose.Schema({
      name: String,
      slug: String,
      section: mongoose.Schema.Types.ObjectId,
    }, { collection: 'categories' }));
    
    const Product = mongoose.model('Product', new mongoose.Schema({
      name: String,
      categories: [mongoose.Schema.Types.ObjectId],
    }, { collection: 'products' }));

    const products = await Product.find();
    console.log(`Total products in database: ${products.length}`);
    
    for (const p of products) {
      const catNames = [];
      for (const catId of p.categories || []) {
        const cat = await Category.findById(catId);
        catNames.push(cat ? cat.name : `Unknown (${catId})`);
      }
      console.log(`- "${p.name}" categories: [${catNames.join(', ')}]`);
    }

    mongoose.disconnect();
  })
  .catch(err => {
    console.error("DB connection error:", err);
  });
