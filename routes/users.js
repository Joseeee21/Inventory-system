const express = require("express")
const router = express.Router(); 

// for hashing password
const bcrypt = require('bcrypt'); 

module.exports = router; 

// automatically generate product's sku number based on the selected category and measurement
router.get("/products/generate-sku", (req, res) => {
    const {categoryID, measurementID} = req.query;

    if(!categoryID || !measurementID){
        return res.status(400).json({error: "Missing categoryID or measurementID"})
    }

    const getCatNMeas = `
        SELECT 
            c.categoryCode,
            m.abbreviation
        FROM categories c
        JOIN measurements m 
        where c.categoryID = ? 
        AND m.measurementID = ?`;


    global.db.get(getCatNMeas, [categoryID, measurementID], (err, data) => {
        if(err){
            return res.status(500).json({error: err.message});
        }

        if(!data){
            return res.status(404).json({error: "Category or measurement not found"}); 
        }

        const prefix = `${data.categoryCode}-${data.abbreviation}`; 

        const countSKU = `
            SELECT productSKU
            FROM products
            WHERE productSKU LIKE ?
            ORDER BY productID DESC
            LIMIT 1`; 

        global.db.get(countSKU, [`${prefix}-%`], (err, lastProduct) => {
            if(err){
                return res.status(500).json({error: err.message}); 
            }

            let nextNum = 1; 

            if(lastProduct && lastProduct.productSKU){
                const parts = lastProduct.productSKU.split("-");
                const lastNum = parseInt(parts[2]);

                if(!isNaN(lastNum)){
                    nextNum = lastNum + 1; 
                }
            }

            const paddedNum = String(nextNum).padStart(3, "0");
            const newSKU = `${prefix}-${paddedNum}`; 

            res.json({
                sku: newSKU
            });
        })
    })
})

// main page 
router.get("/", (req, res) => {
    res.render("home-page.ejs")
})

router.get("/products", (req, res) => {
    const sql = `
        SELECT 
            p.productID, 
            p.productSKU, 
            p.productName,
            c.categoryName,
            m.measurementName,
            m.abbreviation, 
            p.productDesc
        FROM products p
        JOIN categories c ON p.categoryID = c.categoryID 
        JOIN measurements m on p.measurementID = m.measurementID 
    `;

    global.db.all(sql, [], (err, rows) => {
        if(err){
            return res.status(500).json({error: err.message}); 
        }

        res.render("products.ejs", {
            products: rows
        })
    })
});

// add new product
router.get("/products/add", (req, res) => {
    const newProdCategory = `SELECT categoryID, categoryName FROM categories`;
    const newProdMeasurement = `SELECT measurementID, measurementName, abbreviation FROM measurements`; 

    global.db.all(newProdCategory, [], (err, categories) => {
        if(err){
            return res.status(500).send("Database error: " + err.message); 
        }

        global.db.all(newProdMeasurement, [], (err, measurements) => {
            if(err){
                return res.status(500).send("Database error: " + err.message); 
            }

            res.render("add-product.ejs", {
                categories: categories,
                measurements: measurements
            })
        })
    })
}); 

// save the new product details into database
router.post("/products/add", (req, res) => {
    const {productName, productSKU, categoryID, productDesc, measurementID } = req.body; 

    const newProductData = `
        INSERT INTO products(
        productName, productSKU, categoryID, productDesc, measurementID)
        VALUES (?, ?, ?, ?, ?)`;

    global.db.run(newProductData, [productName, productSKU, categoryID, productDesc, measurementID], function(err){
        if(err){
            return res.status(500).send("Database error: " + err.message);
        }

        res.redirect("/products")
    })
})


// product's details including movement history, 
router.get("/products/:id", (req, res) => {
    const productID = req.params.id; 

    const prodDetails = `
        SELECT  p.productID, 
                p.productSKU,
                p.productName,
                p.productDesc,
                c.categoryName,
                m.measurementName,
                m.abbreviation,
                COALESCE (SUM(
                    CASE
                        WHEN mt.movementTypeName = 'IN' THEN sm.quantity
                        WHEN mt.movementTypeName = 'RETURN' THEN sm.quantity
                        WHEN mt.movementTypeName = 'OUT' THEN -sm.quantity
                        WHEN mt.movementTypeName = 'DAMAGE' THEN -sm.quantity
                        WHEN mt.movementTypeName = 'ADJUSTMENT' THEN sm.quantity
                        ELSE 0
                    END
                ), 0) AS currentStock
        FROM products p
        JOIN categories c ON p.categoryID = c.categoryID
        JOIN measurements m ON p.measurementID = m.measurementID
        LEFT JOIN stock_movement sm ON p.productID = sm.productID
        LEFT JOIN movement_types mt ON sm.movementTypeID = mt.movementTypeID
        WHERE p.productID = ?
        GROUP BY p.productID`; 

    const prodMovement = `
        SELECT 
            sm.movementID,
            mt.movementTypeName, 
            sm.quantity,
            sm.remarks,
            sm.createdAt
        FROM stock_movement sm
        JOIN movement_types mt ON sm.movementTypeID = mt.movementTypeID
        WHERE sm.productID = ?
        ORDER BY sm.createdAt DESC`; 

    global.db.get(prodDetails, [productID], (err, product) => {
        if(err){
            return res.status(500).send("Database error: " + err.message)
        }

        if(!product){
            return res.status(404).send("Product not found"); 
        }

        global.db.all(prodMovement, [productID], (err, movements) => {
            if(err){
                return res.status(500).send("Database error: " + err.message)
            }

            res.render("product-details.ejs", {
                product: product,
                movements:movements
            })
        })
    })
})

// add stock inside the product details page 
router.get("/products/:id/stock/add", (req, res) => {
    const productID = req.params.id;

    const prodData = `
        SELECT productID, productSKU, productName
        FROM products
        WHERE productID = ?`; 

    const prodMovementType = `
        SELECT movementTypeID, movementTypeName
        FROM movement_types
        ORDER BY movementTypeName`;

    global.db.get(prodData, [productID], (err, product) => {
        if(err){
            return res.status(500).send("Database error: " + err.message);
        }

        if(!product){
            return res.status(404).send("Product not found.")
        }

        global.db.all(prodMovementType, [], (err, movementTypes) => {
            if(err){
                return res.status(500).send("Database error: " + err.message); 
            }

            res.render("add-stock.ejs", {
                product: product,
                movementTypes: movementTypes
            })
        })
    })
})

router.post("/products/:id/stock/add", (req, res) => {
    const productID = req.params.id;
    let {movementTypeID, quantity, remarks} = req.body; 

    quantity = parseFloat(quantity); 

    if(!movementTypeID){
        return res.status(400).send("Please select a movement type.")
    }

    if(isNaN(quantity) || quantity <= 0){
        return res.status(400).send("Quantity must be more than 0."); 
    }

    const addStock = `
        INSERT INTO stock_movement (
            productID,
            movementTypeID,
            quantity, 
            createdBy,
            remarks)
        VALUES (?, ?, ?, ?, ?)`

    const createdAt = req.session.userID || 1; 

    global.db.run(addStock, [productID, movementTypeID, quantity, createdBy, remarks], function(err){
        if(err){
            return res.status(500).send("Database error: " + err.message); 
        }
        res.redirect(`/products/${productID}`)
    })

})

// delete feature for each of the product on the list 
router.post("/products/:id/delete", (req, res) => {
    const productID = req.params.id;
    
    const deleteProduct = `
        DELETE FROM products 
        WHERE productID = ?`

    global.db.run(deleteProduct, [productID], function(err){
        if(err){
            return res.status(500).send("Database error: " + err.message);
        }

        res.redirect("/products")
    })
})

// edit feature for each of the product 
router.get("/products/:id/edit", (req, res) => {
    const productID = req.params.id; 

    const editProduct = `
        SELECT 
            p.productID,
            p.productSKU, 
            p.productName,
            p.productDesc,
            c.categoryName,
            m.measurementName, 
            m.abbreviation
        FROM products p
        JOIN categories c ON p.categoryID = c.categoryID
        JOIN measurements m on p.measurementID = m.measurementID
        WHERE productID = ?`; 

    global.db.get(editProduct, [productID], (err, product)=>{
        if(err){
            return res.status(500).send("Database error: " + err.message);
        }

        if(!product){
            return res.status(404).send("Product not found")
        }

        res.render("edit-product.ejs", {
            product: product
        })
    })
})

router.post("/products/:id/edit", (req, res) => {
    const productID = req.params.id; 
    const {productName, productDesc} = req.body; 

    const editProduct = `
        UPDATE products
        SET productName = ?,
            productDesc = ? 
        WHERE productID = ?`; 

    global.db.get(editProduct, [productName, productDesc, productID], (err)=>{
        if(err){
            return res.status(500).send("Database error: " + err.message);
        }

        res.redirect("/products"); 
    })
})

// CATEGORIES
// all category 
router.get("/categories", (req, res) => {
    const allCategory = `
    SELECT * FROM categories`;

    global.db.all(allCategory, [], (err, categories) => {
        if(err){
            return res.status(500).send("Database error: " + err.message); 
        }
        res.render("categories.ejs", {
            categories:categories
        })
    })
})

// add category 
router.get("/categories/add", (req, res) => {
    res.render("add-categories.ejs")
})

router.post("/categories/add", (req, res) => {
    const {categoryName, categoryCode} = req.body; 

    categoryCode = categoryCode.toUpperCase(); 

    const addCategory = `
        INSERT INTO categories (categoryName, categoryCode)
        VALUES (?, ?)`;
    
    global.db.run(addCategory, [categoryName, categoryCode], (err) => {
        if(err){
            return res.status(500).send("Database error : " + err.message); 
        }

        res.redirect("/categories"); 
    })
})

//delete category
router.post("/categories/:id/delete", (req, res) => {
    const categoryID = req.params.id;
    
    const deleteCategory = `
        DELETE FROM categories 
        WHERE categoryID = ?`

    global.db.run(deleteCategory, [categoryID], function(err){
        if(err){
            return res.status(500).send("Database error: " + err.message);
        }

        res.redirect("/categories")
    })
})

// MEASUREMENTS 
// all measurements 
router.get("/measurements", (req, res) => {
    const allMeasurements = `
    SELECT * FROM measurements`;

    global.db.all(allMeasurements, [], (err, measurements) => {
        if(err){
            return res.status(500).send("Database error: " + err.message); 
        }
        res.render("measurements.ejs", {
            measurements:measurements
        })
    })
})

// add measurement
router.get("/measurements/add", (req, res) => {
    res.render("add-measurements.ejs")
})

router.post("/measurements/add", (req, res) => {
    let {measurementName, abbreviation} = req.body; 

    measurementName = measurementName.trim();
    measurementName = measurementName.charAt(0).toUpperCase() + measurementName.slice(1).toLowerCase(); 

    const addMeasurement = `
        INSERT INTO measurements (measurementName, abbreviation)
        VALUES (?, ?)`;
    
    global.db.run(addMeasurement, [measurementName, abbreviation], (err) => {
        if(err){
            return res.status(500).send("Database error : " + err.message); 
        }

        res.redirect("/measurements"); 
    })
})

//delete measurement
router.post("/measurements/:id/delete", (req, res) => {
    const measurementID = req.params.id;
    
    const deleteMeasurement = `
        DELETE FROM measurements 
        WHERE measurementID = ?`

    global.db.run(deleteMeasurement, [measurementID], function(err){
        if(err){
            return res.status(500).send("Database error: " + err.message);
        }

        res.redirect("/measurements")
    })
})