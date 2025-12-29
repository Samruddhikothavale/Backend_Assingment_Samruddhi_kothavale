const express = require('express');
const app = express();
const port = 3000;

const db={
    "Companies": [
        { "id": 1, "name": "TechCorp" }
    ],
    "products": [
        { "id": 1, "name": "Laptop", "sku": "TC-LAP-001", "companyId": 1 ."productType": "Electronics","supplies_id": 1 },
        { "id": 2, "name": "Smartphone", "sku": "TC-PHN-002", "companyId": 1 ,"productType": "Electronics","supplies_id": 2 }
    ],
    "warehouses": [
        { "id": 1, "name": "Main Warehouse", "comanyId": 1 },
        { "id": 2, "name": "Secondary Warehouse", "comanyId": 1 }
    ],
    "supplies": [

        { "id": 1, "productId": 1, "email": "abc@email.com"},
        { "id": 2, "productId": 2, "email": "xyz@email.com"}
    ],
    "stock_levels": [
        { "productId": 1, "warehouseId": 1, "quantity": 5 },
        { "productId": 1, "warehouseId": 2, "quantity": 60 },
        { "productId": 2, "warehouseId": 1, "quantity": 2 }
    ],
    "sales" : [
        { "id": 1, "productId": 1, "quantity": 3, "date": "2023-10-01" },
        { "id": 2, "productId": 2, "quantity": 1, "date": "2023-10-02" }
    ],
    "thresholds": [
        { "productId": 1, "threshold": 10 },
        { "productId": 2, "threshold": 5 }
    ]
};

def calculatedaysuntilstackout = (productId,quantites) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesInLast30Days = db.sales.filter(sale => sale.productId === productId && new Date(sale.date) >= thirtyDaysAgo);
    const totalSold = salesInLast30Days.reduce((sum, sale) => sum + sale.quantity, 0);

    if (totalSold === 0) return null; 
    const averageDailySales = totalSold / 30;
    return Math.floor(quantites / averageDailySales);
};

app.get('/api/companies/:companyId/alerts/low-stock', (req, res) => {
    const companyId = parseInt(req.params.companyId);

    // 1. Validation
    const company = db.Companies.find(c => c.id === companyId);
    if (!company) {
        return res.status(404).json({ error: "Company not found" });
    }

    const alerts = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 2. Filter products 
    const companyProducts = db.products.filter(p => p.companyId === companyId);

    companyProducts.forEach(product => {
        // Only alert for products with recent sales activity
        const hasRecentSales = db.sales.some(s =>
            s.productId === product.id && new Date(s.date) >= thirtyDaysAgo
        );
        if (!hasRecentSales) return;

        // 3. Check stock in each warehouse
        const stockEntries = db.stock_levels.filter(s => s.productId === product.id);
        const thresholdEntry = db.thresholds.find(t => t.productId === product.id);
        const threshold = thresholdEntry ? thresholdEntry.threshold : 0;

        stockEntries.forEach(stock => {
            if (stock.quantity <= threshold) {
                const warehouse = db.warehouses.find(w => w.id === stock.warehouseId);
                const supplier = db.supplies.find(sup => sup.id === product.supplies_id);

                // 4. Construct Alert Object
                alerts.push({
                    product_id: product.id,
                    product_name: product.name,
                    sku: product.sku,
                    warehouse_id: stock.warehouseId,
                    warehouse_name: warehouse ? warehouse.name : "Unknown Warehouse",
                    current_stock: stock.quantity,
                    threshold: threshold,
                    days_until_stockout: calculateDaysUntilStockout(product.id, stock.quantity),
                    supplier: {
                        id: supplier?.id,
                        name: supplier ? `Supplier ${supplier.id}` : null, // Assuming no name, using placeholder
                        contact_email: supplier?.email
                    }
                });
            }
        });
    });

    res.json({
        alerts: alerts,
        total_alerts: alerts.length
    });
});

app.listen(PORT, () => console.log(`Low Stock Alert API running on port ${PORT}`));
