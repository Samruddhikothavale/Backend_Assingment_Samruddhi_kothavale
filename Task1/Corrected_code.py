#importing required libraries for Decimal , jesonify

@app.route('/api/products', methods=['POST'])
def create_product():
    data = request.json

    required_fields=['name','sku','price','warehouse_id','initial_quantity']
    if not all(field in data for field in required_fields):
        return jesonify({"error":"Missing requiered fields"}),400
    
    try:

        #type validation for price
        price=Decimal(str(data['price']))
        if price <0:
            return jesonify({"error":"Price must non-negative"}),400


        # Create new product
        product = Product(
            name=data['name'],
            sku=data['sku'],
            price=price,
            warehouse_id=data['warehouse_id']
        )
        
        db.session.add(product)
    
        
        # Update inventory count
        inventory = Inventory(
            product_id=product.id,
            warehouse_id=data['warehouse_id'],
            quantity=data['initial_quantity']
        )
        
        db.session.add(inventory)

        #final commit for both
        db.session.commit()
        
        return jesonify({"message": "Product created", "product_id": product.id}),201
    
    except Exception as e:
        db.session.rollback()
        return {"error":str(e)},400

