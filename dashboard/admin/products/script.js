document.addEventListener('DOMContentLoaded', async function() {
    const productList = document.getElementById('productList');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sellerFilter = document.getElementById('sellerFilter');
    const userData = JSON.parse(localStorage.getItem('userData') || {});

    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    let products = [];
    async function loadProducts() {
        try {
            const response = await fetch('../../buyer/data/products.json');
            if (!response.ok) throw new Error('Failed to load products.json');
            let jsonProducts = await response.json();
            jsonProducts = jsonProducts.map(p => ({ ...p, id: String(p.id), status: p.status || 'approved' }));

            let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
            localProducts = localProducts.map(p => ({ ...p, id: String(p.id), status: p.status || 'pending' }));

            const allProducts = [...jsonProducts, ...localProducts];
            products = Array.from(new Map(allProducts.map(p => [p.id, p])).values());
            renderProducts(products);
        } catch (e) {
            console.error('Error loading products:', e);
            let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
            products = localProducts.map(p => ({ ...p, id: String(p.id), status: p.status || 'pending' }));
            renderProducts(products);
        }
    }

    function renderProducts(productsToRender) {
        const category = categoryFilter.value;
        const status = statusFilter.value;
        const seller = sellerFilter.value.toLowerCase();

        const filteredProducts = productsToRender.filter(product => {
            const matchesCategory = category === 'all' || product.category === category;
            const matchesStatus = status === 'all' || product.status === status;
            const matchesSeller = !seller || product.seller?.toLowerCase().includes(seller);
            return matchesCategory && matchesStatus && matchesSeller;
        });

        if (filteredProducts.length === 0) {
            productList.innerHTML = '<p>Нет товаров по выбранным критериям</p>';
            return;
        }

        productList.innerHTML = filteredProducts.map(product => `
            <div class="product-card status-${product.status}">
                <img src="${product.images[0]}" alt="${product.name}" 
                     onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>Цена: ${product.price.toLocaleString('ru-RU')} ₽</p>
                    <p>Категория: ${product.category}</p>
                    <p>Статус: ${product.status === 'pending' ? 'Ожидает модерации' : 
                                  product.status === 'approved' ? 'Одобрено' : 'Отклонено'}</p>
                    <p>Продавец: ${product.seller || 'Не указан'}</p>
                </div>
                <div class="product-actions">
                    ${product.status === 'pending' ? `
                        <button class="btn approve-btn" data-id="${product.id}">Одобрить</button>
                        <button class="btn reject-btn" data-id="${product.id}">Отклонить</button>
                    ` : ''}
                    <button class="btn edit-btn" data-id="${product.id}">Редактировать</button>
                    <button class="btn delete-btn" data-id="${product.id}">Удалить</button>
                </div>
            </div>
        `).join('');
    }

    productList.addEventListener('click', function(e) {
        const productId = e.target.dataset.id;
        if (!productId) return;

        if (e.target.classList.contains('approve-btn')) {
            updateProductStatus(productId, 'approved');
        } else if (e.target.classList.contains('reject-btn')) {
            updateProductStatus(productId, 'rejected');
        } else if (e.target.classList.contains('edit-btn')) {
            alert('Функция редактирования в разработке');
        } else if (e.target.classList.contains('delete-btn')) {
            if (confirm('Удалить товар?')) {
                let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
                localProducts = localProducts.filter(p => p.id !== productId);
                localStorage.setItem('products', JSON.stringify(localProducts));
                loadProducts();
            }
        }
    });

    function updateProductStatus(productId, newStatus) {
        let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        localProducts = localProducts.map(p => p.id === productId ? { ...p, status: newStatus } : p);
        localStorage.setItem('products', JSON.stringify(localProducts));
        loadProducts();
    }

    categoryFilter.addEventListener('change', () => renderProducts(products));
    statusFilter.addEventListener('change', () => renderProducts(products));
    sellerFilter.addEventListener('input', () => renderProducts(products));

    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../../auth/index.html';
    });

    loadProducts();
});