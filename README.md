--Things that to setup (follow step by step): 
1. type "npm init -y" to setup the package-json 
2. type "npm install" to install the node_modules
3. install the stuff that we need for this project
4. setup the scripts for running the project, for example like "start", etc. 
5. setup all the stuff in the index.js 


--THE STEP TO ADD A NEW FEATURE
1. add the logic in the users.ejs (whether GET or POST)
2. add the front end for the website in the views.folder


Basic features that a inventory system should have: 
- add product (done)    -> show category, measurement, description 
- edit product (done)    -> 
- delete product (done)  -> 
- view product details -> 
- search product -> 


// --- edit ver.01 
// edit feature for each of the product 
router.get("/products/:id/edit", (req, res) => {
    const productID = req.params.id; 

    const editProduct = `
        SELECT * FROM products
        WHERE productID = ?`; 

    const editProdCategory = `
        SELECT * FROM categories`;

    const editProdMeasurement = `
        SELECT * FROM measurements`

    global.db.get(editProduct, [productID], (err, product)=>{
        if(err){
            return res.status(500).send("Database error: " + err.message);
        }

        if(!product){
            return res.status(404).send("Product not found")
        }

        global.db.all(editProdCategory, [], (err, categories) => {
            if(err){
                return res.status(500).send("Database error : " + err.message); 
            }

            global.db.all(editProdMeasurement, [], (err, measurements) => {
                if(err){
                    return res.status(500).send("Database error : " + err.message); 
                }

                res.render("edit-product.ejs", {
                product: product,
                categories: categories,
                measurements: measurements
                })
            })
        })
    })
})


// edit-product.ejs ver.01

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Product Details</title>
    <link rel="stylesheet" href="/main.css">
</head>

<body>
    <h1>Edit Product</h1>
    
    <form action="/products/<%= product.productID %>/edit" method="POST">
        <label>Product Name :</label>
        <input type="text" name="productName" value="<%= product.productName %>"  required> 
        <br><br>

        <label>Product SKU :</label>
        <input type="text" name="productSKU" value="<%= product.productSKU %>" required>
        <br><br>

        <label>Category : </label>
        <select name="categoryID" required>
            <% categories.forEach(function(category) { %>
                <option value="<%= category.categoryID %>"
                    <%= category.categoryID === product.categoryID ? "selected" : "" %>>
                    <%= category.categoryName %>
                </option>
            <% }) %>
        </select>
        <br><br>

        <label>Measurement : </label>
        <select name="measurementID" required>
            <% measurements.forEach(function(measurement) { %>
                <option value="<%= measurement.measurementID %>"
                    <%= measurement.measurementID === product.measurementID ? "selected" : "" %>>
                    <%= measurement.measurementName %> (<%= measurement.abbreviation %>)
                </option>    
            <% }) %>
        </select>
        <br><br>

        <label>Description : </label>
        <textarea name="productDesc"><%= product.productDesc %></textarea>
        <br><br>

        <button type="submit">Update Product</button>
        <br><br>

        <a href="/products">Back to Products</a>
    </form>
</body>
</html>