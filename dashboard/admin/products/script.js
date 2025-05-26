document.addEventListener('DOMContentLoaded', async function() {
    const productList = document.getElementById('productList');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sellerFilter = document.getElementById('sellerFilter');
    const productModal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.querySelector('.product-modal .close-modal');
    const editModal = document.getElementById('editProductModal');
    const userData = JSON.parse(localStorage.getItem('userData') || {});

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 900;
    `;
    document.body.appendChild(overlay);

    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    let products = [];
    async function loadProducts() {
        try {
            const response = await fetch('../../buyer/data/products.json');
            if (!response.ok) throw new Error('Failed to load products.json');
            let jsonProducts = await response.json();
            jsonProducts = jsonProducts.map(p => ({
                ...p,
                id: String(p.id),
                status: p.status && ['pending', 'approved', 'rejected'].includes(p.status) ? p.status : 'approved',
                source: 'json'
            }));

            let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
            localProducts = localProducts.map(p => ({
                ...p,
                id: String(p.id),
                status: p.status && ['pending', 'approved', 'rejected'].includes(p.status) ? p.status : 'pending',
                source: 'local'
            }));

            const allProducts = [...jsonProducts, ...localProducts];
            products = Array.from(new Map(allProducts.map(p => [p.id, p])).values());
            renderProducts(products);
        } catch (e) {
            console.error('Error loading products:', e);
            let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
            localProducts = localProducts.map(p => ({
                ...p,
                id: String(p.id),
                status: p.status && ['pending', 'approved', 'rejected'].includes(p.status) ? p.status : 'pending',
                source: 'local'
            }));
            products = localProducts;
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
            <div class="product-card status-${product.status}" data-product-id="${product.id}">
                <div class="product-image-container">
                    <div class="product-image">
                        <img src="${product.images[0].replace('../../', '../../../')}" alt="${product.name}" 
                             onerror="this.onerror=null;this.src='https://via.placeholder.com/150?text=No+Image'">
                    </div>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>Цена: ${product.price.toLocaleString('ru-RU')} ₽</p>
                    <p>Категория: ${product.category}</p>
                    <p>Статус: ${product.status === 'pending' ? 'Ожидает модерации' : 
                                  product.status === 'approved' ? 'Одобрено' : 'Отклонено'}</p>
                    <p>Продавец: ${product.seller || 'Не указан'}</p>
                </div>
                <div class="product-actions">
                    <button class="btn approve-btn" data-id="${product.id}">
                        ${product.status === 'approved' ? 'Одобрено' : 'Одобрить'}
                    </button>
                    <button class="btn reject-btn" data-id="${product.id}">
                        ${product.status === 'rejected' ? 'Отклонено' : 'Отклонить'}
                    </button>
                    <button class="btn edit-btn" data-id="${product.id}">Редактировать</button>
                    ${product.status === 'pending' ? `
                        <button class="btn delete-btn" data-id="${product.id}">Удалить</button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.classList.contains('btn')) {
                    const productId = this.dataset.productId;
                    const product = products.find(p => p.id === productId);
                    if (product) {
                        showProductModal(product);
                    }
                }
            });
        });
    }

    function showProductModal(product) {
        let currentImageIndex = 0;

        modalBody.innerHTML = `
            <div class="modal-images">
                <div class="main-image-container">
                    <div class="main-image-wrapper">
                        <img src="${product.images[0].replace('../../', '../../../')}" alt="${product.name}" 
                             class="main-image"
                             onerror="this.onerror=null;this.src='https://via.placeholder.com/800x450?text=No+Image'">
                    </div>
                    <button class="carousel-prev"><</button>
                    <button class="carousel-next">></button>
                </div>
                <div class="thumbnail-container">
                    ${product.images.map((img, index) => `
                        <div class="thumbnail-item">
                            <img src="${img.replace('../../', '../../../')}" alt="${product.name} Thumbnail ${index + 1}" 
                                 class="thumbnail ${index === 0 ? 'active' : ''}" 
                                 data-index="${index}"
                                 onerror="this.onerror=null;this.src='https://via.placeholder.com/80x60?text=No+Image'">
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-details">
                <h2>${product.name}</h2>
                <div class="modal-price">${product.price.toLocaleString('ru-RU')} ₽</div>
                <div class="modal-meta">
                    <p><strong>Марка:</strong> ${product.brand}</p>
                    <p><strong>Модель:</strong> ${product.model}</p>
                    <p><strong>Год:</strong> ${product.year}</p>
                    <p><strong>VIN:</strong> ${product.vin}</p>
                    <p><strong>Состояние:</strong> ${product.condition === 'new' ? 'Новый' : 'Б/У'}</p>
                    <p><strong>Категория:</strong> ${product.category}</p>
                    <p><strong>Вес:</strong> ${product.weight} кг</p>
                    <p><strong>Гарантия:</strong> ${product.hasWarranty ? 'Да' : 'Нет'}</p>
                    <p><strong>Рейтинг продавца:</strong> ${product.sellerRating}/5</p>
                </div>
                <div class="modal-description">
                    <h3>Описание</h3>
                    <p>${product.description}</p>
                </div>
                <div class="modal-specs">
                    <h3>Характеристики</h3>
                    <ul>
                        ${Object.entries(product.specifications).map(([key, value]) => 
                            `<li><strong>${key}:</strong> ${value}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;

        const mainImage = document.querySelector('.main-image');
        const thumbnails = document.querySelectorAll('.thumbnail');
        const prevButton = document.querySelector('.carousel-prev');
        const nextButton = document.querySelector('.carousel-next');

        function updateMainImage(index) {
            mainImage.src = product.images[index].replace('../../', '../../../');
            thumbnails.forEach(thumb => thumb.classList.remove('active'));
            thumbnails[index].classList.add('active');
            currentImageIndex = index;
        }

        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function() {
                updateMainImage(parseInt(this.dataset.index));
            });
        });

        prevButton.addEventListener('click', function(e) {
            e.stopPropagation();
            const newIndex = (currentImageIndex - 1 + product.images.length) % product.images.length;
            updateMainImage(newIndex);
        });

        nextButton.addEventListener('click', function(e) {
            e.stopPropagation();
            const newIndex = (currentImageIndex + 1) % product.images.length;
            updateMainImage(newIndex);
        });

        productModal.classList.add('active');
        overlay.classList.add('active');
    }

    closeModal.addEventListener('click', function() {
        productModal.classList.remove('active');
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', function() {
        productModal.classList.remove('active');
        editModal.classList.remove('active');
        editModal.style.opacity = '0';
        setTimeout(() => { editModal.style.display = 'none'; }, 300);
        overlay.classList.remove('active');
    });

    productList.addEventListener('click', function(e) {
        const productId = e.target.dataset.id;
        if (!productId) return;

        if (e.target.classList.contains('approve-btn')) {
            updateProductStatus(productId, 'approved');
        } else if (e.target.classList.contains('reject-btn')) {
            updateProductStatus(productId, 'rejected');
        } else if (e.target.classList.contains('edit-btn')) {
            const product = products.find(p => p.id === productId);
            if (product) {
                editModal.classList.add('active');
                editModal.style.display = 'flex';
                editModal.style.opacity = '1';
                overlay.classList.add('active');
                document.getElementById('modalTitle').textContent = 'Редактировать продукт';
                document.getElementById('productName').value = product.name;
                document.getElementById('productPrice').value = product.price;
                document.getElementById('productWeight').value = product.weight;
                document.getElementById('productBrand').value = product.brand;
                document.getElementById('productModel').value = product.model;
                document.getElementById('productYear').value = product.year;
                document.getElementById('productCategory').value = product.category;
                document.getElementById('productCondition').value = product.condition;
                document.getElementById('productInStock').checked = product.inStock;
                document.getElementById('productHasWarranty').checked = product.hasWarranty;
                document.getElementById('productSellerRating').value = product.sellerRating;
                document.getElementById('productVin').value = product.vin;
                document.getElementById('productDescription').value = product.description;
                document.getElementById('productImage1').value = product.images[0]?.replace('../../../Images/', '') || '';
                document.getElementById('productImage2').value = product.images[1]?.replace('../../../Images/', '') || '';
                document.getElementById('productImage3').value = product.images[2]?.replace('../../../Images/', '') || '';
                document.getElementById('productImage4').value = product.images[3]?.replace('../../../Images/', '') || '';
                document.getElementById('productImage5').value = product.images[4]?.replace('../../../Images/', '') || '';
                document.getElementById('specMaterial').value = product.specifications.material;
                document.getElementById('specCompatibility').value = product.specifications.compatibility;
                document.getElementById('specWarranty').value = product.specifications.warranty;
                document.getElementById('productForm').dataset.productId = productId;
            }
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
        const product = products.find(p => p.id === productId);
        if (product.source === 'json') {
            // Untuk produk dari JSON, simpan status di local storage
            const existingLocal = localProducts.find(p => p.id === productId);
            if (existingLocal) {
                localProducts = localProducts.map(p => p.id === productId ? { ...p, status: newStatus } : p);
            } else {
                localProducts.push({ ...product, status: newStatus, source: 'local' });
            }
        } else {
            // Untuk produk dari local storage, perbarui langsung
            localProducts = localProducts.map(p => p.id === productId ? { ...p, status: newStatus } : p);
        }
        localStorage.setItem('products', JSON.stringify(localProducts));
        loadProducts();
    }

    const productForm = document.getElementById('productForm');
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const productId = e.target.dataset.productId;
        const images = [
            document.getElementById('productImage1').value,
            document.getElementById('productImage2').value,
            document.getElementById('productImage3').value,
            document.getElementById('productImage4').value,
            document.getElementById('productImage5').value
        ].filter(img => img).map(img => `../../../Images/${img}`);

        const updatedProduct = {
            id: productId,
            name: document.getElementById('productName').value || 'Unnamed Product',
            price: parseFloat(document.getElementById('productPrice').value) || 0,
            weight: parseFloat(document.getElementById('productWeight').value) || 0,
            brand: document.getElementById('productBrand').value || 'Unknown',
            model: document.getElementById('productModel').value || 'Unknown',
            year: parseInt(document.getElementById('productYear').value) || 2025,
            category: document.getElementById('productCategory').value || 'Тормоза',
            condition: document.getElementById('productCondition').value || 'new',
            inStock: document.getElementById('productInStock').checked,
            hasWarranty: document.getElementById('productHasWarranty').checked,
            sellerRating: parseFloat(document.getElementById('productSellerRating').value) || 4.5,
            vin: document.getElementById('productVin').value || `VIN${Date.now()}`,
            description: document.getElementById('productDescription').value || 'No description',
            images: images.length > 0 ? images : ['../../../Images/placeholder.jpg'],
            specifications: {
                material: document.getElementById('specMaterial').value || 'Стандарт',
                compatibility: document.getElementById('specCompatibility').value || 'Unknown',
                warranty: document.getElementById('specWarranty').value || '1 год'
            },
            status: products.find(p => p.id === productId)?.status || 'pending',
            seller: products.find(p => p.id === productId)?.seller || userData.email || 'Unknown',
            source: 'local'
        };

        let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        localProducts = localProducts.map(p => p.id === productId ? updatedProduct : p);
        localStorage.setItem('products', JSON.stringify(localProducts));
        loadProducts();
        editModal.classList.remove('active');
        editModal.style.opacity = '0';
        setTimeout(() => { editModal.style.display = 'none'; }, 300);
        overlay.classList.remove('active');
    });

    const editModalCloseBtn = editModal.querySelector('.close-btn');
    const editModalCloseX = editModal.querySelector('.close-modal');
    editModalCloseBtn.addEventListener('click', () => {
        editModal.classList.remove('active');
        editModal.style.opacity = '0';
        setTimeout(() => { editModal.style.display = 'none'; }, 300);
        overlay.classList.remove('active');
    });
    editModalCloseX.addEventListener('click', () => {
        editModal.classList.remove('active');
        editModal.style.opacity = '0';
        setTimeout(() => { editModal.style.display = 'none'; }, 300);
        overlay.classList.remove('active');
    });

    categoryFilter.addEventListener('change', () => renderProducts(products));
    statusFilter.addEventListener('change', () => renderProducts(products));
    sellerFilter.addEventListener('input', () => renderProducts(products));

    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../../auth/index.html';
    });

    loadProducts();
});