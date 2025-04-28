document.addEventListener('DOMContentLoaded', async function() {
    const productGrid = document.getElementById('productGrid');
    const addProductBtn = document.getElementById('addProductBtn');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    // Load products from products.json and localStorage
    let products = [];
    try {
        const response = await fetch('../buyer/data/products.json');
        if (!response.ok) throw new Error('Failed to load products.json');
        const jsonProducts = await response.json();
        
        const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        
        const allProducts = [...jsonProducts, ...localProducts];
        products = Array.from(new Map(allProducts.map(p => [p.id, p])).values());
    } catch (e) {
        console.error('Error loading products:', e);
        products = JSON.parse(localStorage.getItem('products') || '[]');
    }

    // Display products
    renderProducts(products);

    // Modal for adding/editing product
    let modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2 id="modalTitle">Добавить продукт</h2>
            <form id="productForm">
                <div class="form-group">
                    <label for="productName">Название</label>
                    <input type="text" id="productName" required>
                </div>
                <div class="form-group">
                    <label for="productPrice">Цена (₽)</label>
                    <input type="number" id="productPrice" required>
                </div>
                <div class="form-group">
                    <label for="productBrand">Бренд</label>
                    <input type="text" id="productBrand" required>
                </div>
                <div class="form-group">
                    <label for="productModel">Модель</label>
                    <input type="text" id="productModel" required>
                </div>
                <div class="form-group">
                    <label for="productYear">Год</label>
                    <input type="number" id="productYear" required>
                </div>
                <div class="form-group">
                    <label for="productCategory">Категория</label>
                    <select id="productCategory" required>
                        <option value="Тормоза">Тормоза</option>
                        <option value="Подвеска">Подвеска</option>
                        <option value="Двигатель">Двигатель</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="productCondition">Состояние</label>
                    <select id="productCondition" required>
                        <option value="new">Новое</option>
                        <option value="used">Б/У</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="productDescription">Описание</label>
                    <textarea id="productDescription" rows="4" required></textarea>
                </div>
                <div class="form-group">
                    <label for="productImage">URL изображения</label>
                    <input type="text" id="productImage" placeholder="Images/product/image.jpg">
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn">Сохранить</button>
                    <button type="button" class="btn close-btn">Отмена</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Add product
    addProductBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        document.getElementById('modalTitle').textContent = 'Добавить продукт';
        document.getElementById('productForm').reset();
        document.getElementById('productForm').dataset.productId = '';
    });

    // Close modal
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Handle product form submission
    document.getElementById('productForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const productId = e.target.dataset.productId;
        const newProduct = {
            id: productId || Date.now().toString(),
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            brand: document.getElementById('productBrand').value,
            model: document.getElementById('productModel').value,
            year: parseInt(document.getElementById('productYear').value),
            category: document.getElementById('productCategory').value,
            condition: document.getElementById('productCondition').value,
            description: document.getElementById('productDescription').value,
            images: [document.getElementById('productImage').value || 'Images/placeholder.jpg'],
            inStock: true,
            hasWarranty: true,
            sellerRating: 4.5,
            vin: `VIN${Date.now()}`,
            specifications: {
                material: 'Стандарт',
                compatibility: `${document.getElementById('productBrand').value} ${document.getElementById('productModel').value}`,
                warranty: '1 год'
            }
        };

        let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        if (productId) {
            // Edit product
            localProducts = localProducts.map(p => p.id === productId ? newProduct : p);
        } else {
            // Add new product
            localProducts.push(newProduct);
        }
        localStorage.setItem('products', JSON.stringify(localProducts));
        renderProducts([...products.filter(p => !localProducts.some(lp => lp.id === p.id)), ...localProducts]);
        modal.style.display = 'none';
    });

    // Product actions
    productGrid.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        if (!productId) return;

        if (e.target.classList.contains('edit-btn')) {
            const product = products.find(p => p.id === productId);
            if (product) {
                modal.style.display = 'flex';
                document.getElementById('modalTitle').textContent = 'Редактировать продукт';
                document.getElementById('productName').value = product.name;
                document.getElementById('productPrice').value = product.price;
                document.getElementById('productBrand').value = product.brand;
                document.getElementById('productModel').value = product.model;
                document.getElementById('productYear').value = product.year;
                document.getElementById('productCategory').value = product.category;
                document.getElementById('productCondition').value = product.condition;
                document.getElementById('productDescription').value = product.description;
                document.getElementById('productImage').value = product.images[0];
                document.getElementById('productForm').dataset.productId = productId;
            }
        } else if (e.target.classList.contains('delete-btn')) {
            if (confirm('Вы уверены, что хотите удалить этот продукт?')) {
                let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
                localProducts = localProducts.filter(p => p.id !== productId);
                localStorage.setItem('products', JSON.stringify(localProducts));
                renderProducts([...products.filter(p => !localProducts.some(lp => lp.id === p.id)), ...localProducts]);
            }
        }
    });

    // Render products
    function renderProducts(products) {
        productGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <img src="${product.images[0]}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">${product.price.toLocaleString('ru-RU')} ₽</div>
                    <div class="product-actions">
                        <button class="btn edit-btn" data-product-id="${product.id}">Редактировать</button>
                        <button class="btn btn-danger delete-btn" data-product-id="${product.id}">Удалить</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Logout
    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../auth/index.html';
    });
});