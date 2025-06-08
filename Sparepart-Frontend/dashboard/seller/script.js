document.addEventListener('DOMContentLoaded', async function() {
    // DOM Elements
    const productGrid = document.getElementById('productGrid');
    const addProductBtn = document.getElementById('addProductBtn');
    const productModal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.querySelector('.product-modal .close-modal');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    // Create overlay
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

    // Debugging: Check if elements exist
    console.log('productGrid:', productGrid);
    console.log('addProductBtn:', addProductBtn);
    console.log('productModal:', productModal);
    console.log('modalBody:', modalBody);
    console.log('closeModal:', closeModal);
    console.log('userData:', userData);

    if (!productGrid) console.error('productGrid not found');
    if (!addProductBtn) console.error('addProductBtn not found');
    if (!productModal) console.error('productModal not found');
    if (!modalBody) console.error('modalBody not found');
    if (!closeModal) console.error('closeModal not found');

    // Set username
    if (userData.username) {
        const displayUsername = document.getElementById('displayUsername');
        if (displayUsername) {
            displayUsername.textContent = userData.username;
        } else {
            console.error('displayUsername not found');
        }
    }

    // Load products
    let products = [];
    let jsonProducts = [];
    let localProducts = [];
    try {
        const response = await fetch('../buyer/data/products.json');
        if (!response.ok) throw new Error('Failed to load products.json');
        jsonProducts = await response.json();
        jsonProducts = jsonProducts.map(p => ({ ...p, id: String(p.id) }));
        jsonProducts = jsonProducts.map(p => ({
            ...p,
            id: String(p.id),
            status: p.status && ['pending', 'approved', 'rejected'].includes(p.status) ? p.status : 'pending'
        }));
        console.log('jsonProducts:', jsonProducts);
        
        localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        localProducts = localProducts.map(p => ({ ...p, id: String(p.id) }));
        localProducts = localProducts.map(p => ({
            ...p,
            id: String(p.id),
            status: p.status && ['pending', 'approved', 'rejected'].includes(p.status) ? p.status : 'pending'
        }));
        console.log('localProducts:', localProducts);
        
        products = Array.from(new Map([...jsonProducts, ...localProducts].map(p => [p.id, p])).values())
    .filter(p => p.status !== 'rejected');
        console.log('Merged products:', products);
    } catch (e) {
        console.error('Error loading products:', e);
        localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        localProducts = localProducts.map(p => ({ ...p, id: String(p.id) }));
        products = localProducts;
        console.log('Fallback to localProducts:', products);
    }

    // Display products
    renderProducts(products);

    // Modal for adding/editing product
    let editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.id = 'editProductModal';
    editModal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal">×</button>
            <h2 id="modalTitle">Добавить продукт</h2>
            <form id="productForm">
                <div class="form-group">
                    <label for="productName">Название</label>
                    <input type="text" id="productName" required>
                </div>
                <div class="form-group">
                    <label for="productPrice">Цена (₽)</label>
                    <input type="number" id="productPrice" required min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label for="productWeight">Вес (кг)</label>
                    <input type="number" id="productWeight" required min="0" step="0.1">
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
                    <input type="number" id="productYear" required min="1900" max="2025">
                </div>
                <div class="form-group">
                    <label for="productCategory">Категория</label>
                    <select id="productCategory" required>
                        <option value="Тормоза">Тормоза</option>
                        <option value="Подвеска">Подвеска</option>
                        <option value="Двигатель">Двигатель</option>
                        <option value="Фильтры">Фильтры</option>
                        <option value="Смазки">Смазки</option>
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
                    <label for="productInStock">В наличии</label>
                    <input type="checkbox" id="productInStock">
                </div>
                <div class="form-group">
                    <label for="productHasWarranty">Гарантия</label>
                    <input type="checkbox" id="productHasWarranty">
                </div>
                <div class="form-group">
                    <label for="productSellerRating">Рейтинг продавца (1-5)</label>
                    <input type="number" id="productSellerRating" required min="1" max="5" step="0.1">
                </div>
                <div class="form-group">
                    <label for="productVin">VIN</label>
                    <input type="text" id="productVin" required>
                </div>
                <div class="form-group">
                    <label for="productDescription">Описание</label>
                    <textarea id="productDescription" rows="4" required></textarea>
                </div>
                <div class="form-group">
                    <label>Изображения (до 5, формат: product/image.jpg)</label>
                    <input type="text" id="productImage1" placeholder="product/image1.jpg">
                    <input type="text" id="productImage2" placeholder="product/image2.jpg">
                    <input type="text" id="productImage3" placeholder="product/image3.jpg">
                    <input type="text" id="productImage4" placeholder="product/image4.jpg">
                    <input type="text" id="productImage5" placeholder="product/image5.jpg">
                </div>
                <div class="form-group">
                    <label for="specMaterial">Материал</label>
                    <input type="text" id="specMaterial" required>
                </div>
                <div class="form-group">
                    <label for="specCompatibility">Совместимость</label>
                    <input type="text" id="specCompatibility" required>
                </div>
                <div class="form-group">
                    <label for="specWarranty">Гарантия</label>
                    <input type="text" id="specWarranty" required>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn">Сохранить</button>
                    <button type="button" class="btn close-btn">Отмена</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(editModal);
    console.log('editModal appended to DOM:', editModal);

    // Set initial styles for modal
    editModal.style.display = 'none';
    editModal.style.opacity = '0';
    editModal.style.transition = 'opacity 0.3s';

    // Add product button event
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            console.log('Add product button clicked');
            editModal.classList.add('active');
            editModal.style.display = 'flex';
            editModal.style.opacity = '1';
            overlay.classList.add('active');
            document.getElementById('modalTitle').textContent = 'Добавить продукт';
            document.getElementById('productForm').reset();
            document.getElementById('productForm').dataset.productId = '';
            document.getElementById('productInStock').checked = true;
            document.getElementById('productHasWarranty').checked = true;
            document.getElementById('productSellerRating').value = 4.5;
            console.log('editModal active:', editModal.classList.contains('active'));
            console.log('editModal styles:', {
                display: editModal.style.display,
                opacity: editModal.style.opacity
            });
        });
    } else {
        console.error('addProductBtn not found in DOM');
    }

    // Close edit modal
    const editModalCloseBtn = editModal.querySelector('.close-btn');
    const editModalCloseX = editModal.querySelector('.close-modal');
    if (editModalCloseBtn) {
        editModalCloseBtn.addEventListener('click', () => {
            console.log('Edit modal close button clicked');
            editModal.classList.remove('active');
            editModal.style.opacity = '0';
            setTimeout(() => { editModal.style.display = 'none'; }, 300);
            overlay.classList.remove('active');
        });
    }
    if (editModalCloseX) {
        editModalCloseX.addEventListener('click', () => {
            console.log('Edit modal X button clicked');
            editModal.classList.remove('active');
            editModal.style.opacity = '0';
            setTimeout(() => { editModal.style.display = 'none'; }, 300);
            overlay.classList.remove('active');
        });
    }

    // Overlay click to close modals
    overlay.addEventListener('click', () => {
        console.log('Overlay clicked');
        editModal.classList.remove('active');
        editModal.style.opacity = '0';
        setTimeout(() => { editModal.style.display = 'none'; }, 300);
        if (productModal) {
            productModal.classList.remove('active');
        }
        overlay.classList.remove('active');
    });

    // Handle product form submission
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Product form submitted');
            const productId = e.target.dataset.productId;
            const images = [
                document.getElementById('productImage1').value,
                document.getElementById('productImage2').value,
                document.getElementById('productImage3').value,
                document.getElementById('productImage4').value,
                document.getElementById('productImage5').value
            ].filter(img => img).map(img => `../../Images/${img}`);

            const newProduct = {
                id: productId || Date.now().toString(),
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
                images: images.length > 0 ? images : ['../../Images/placeholder.jpg'],
                specifications: {
                    material: document.getElementById('specMaterial').value || 'Стандарт',
                    compatibility: document.getElementById('specCompatibility').value || 'Unknown',
                    warranty: document.getElementById('specWarranty').value || '1 год'
                },
                status: productId ? (products.find(p => p.id === productId)?.status || 'pending') : 'pending'
            };

            let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
            if (productId) {
                localProducts = localProducts.map(p => p.id === productId ? newProduct : p);
            } else {
                localProducts.push(newProduct);
            }
            localStorage.setItem('products', JSON.stringify(localProducts));
            products = Array.from(new Map([...jsonProducts, ...localProducts].map(p => [p.id, p])).values())
    .filter(p => p.status !== 'rejected');
            console.log('Updated products:', products);
            renderProducts(products);
            editModal.classList.remove('active');
            editModal.style.opacity = '0';
            setTimeout(() => { editModal.style.display = 'none'; }, 300);
            overlay.classList.remove('active');
            console.log('Product saved:', newProduct);
            window.location.reload();
        });
    } else {
        console.error('productForm not found in DOM');
    }

    // Render products
    function renderProducts(products) {
        products = products.filter(p => p.status !== 'rejected');
        if (!productGrid) {
            console.error('productGrid not found in DOM');
            return;
        }
        console.log('Rendering products:', products);
        productGrid.innerHTML = products.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    <div class="product-image">
                        <img src="${product.images[0]}" alt="${product.name}" 
                             onerror="this.onerror=null;this.src='../../Images/placeholder.jpg'">
                    </div>
                </div>
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

        // Add event listeners to product cards
        const cards = document.querySelectorAll('.product-card');
        console.log('Product cards rendered:', cards.length);
        cards.forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.classList.contains('edit-btn') && !e.target.classList.contains('delete-btn') && !e.target.closest('.product-actions')) {
                    const productId = this.dataset.productId;
                    console.log('Product card clicked, ID:', productId);
                    const product = products.find(p => p.id === productId);
                    if (product) {
                        console.log('Product found:', product);
                        showProductModal(product);
                    } else {
                        console.error('Product not found for ID:', productId);
                    }
                }
            });
        });
    }

    // Show product modal with image carousel (identical to buyer)
    function showProductModal(product) {
        if (!productModal || !modalBody) {
            console.error('productModal or modalBody not found in DOM');
            return;
        }
        let currentImageIndex = 0;
        
        modalBody.innerHTML = `
            <div class="modal-images">
                <div class="main-image-container">
                    <div class="main-image-wrapper">
                        <img src="${product.images[0]}" alt="${product.name}" 
                             class="main-image"
                             onerror="this.onerror=null;this.src='https://via.placeholder.com/800x450?text=No+Image'">
                    </div>
                    <button class="carousel-prev"><</button>
                    <button class="carousel-next">></button>
                </div>
                <div class="thumbnail-container">
                    ${product.images.map((img, index) => `
                        <div class="thumbnail-item">
                            <img src="${img}" alt="${product.name} Thumbnail ${index + 1}" 
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

        // Add event listeners for carousel navigation
        const mainImage = document.querySelector('.main-image');
        const thumbnails = document.querySelectorAll('.thumbnail');
        const prevButton = document.querySelector('.carousel-prev');
        const nextButton = document.querySelector('.carousel-next');

        function updateMainImage(index) {
            mainImage.src = product.images[index];
            thumbnails.forEach(thumb => thumb.classList.remove('active'));
            thumbnails[index].classList.add('active');
            currentImageIndex = index;
        }

        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function() {
                console.log('Thumbnail clicked, index:', this.dataset.index);
                updateMainImage(parseInt(this.dataset.index));
            });
        });

        if (prevButton) {
            prevButton.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('Previous button clicked');
                const newIndex = (currentImageIndex - 1 + product.images.length) % product.images.length;
                updateMainImage(newIndex);
            });
        } else {
            console.error('carousel-prev not found');
        }

        if (nextButton) {
            nextButton.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('Next button clicked');
                const newIndex = (currentImageIndex + 1) % product.images.length;
                updateMainImage(newIndex);
            });
        } else {
            console.error('carousel-next not found');
        }

        productModal.classList.add('active');
        overlay.classList.add('active');
        console.log('Product modal shown for product:', product.name);
    }

    // Close product modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            console.log('Product modal close button clicked');
            productModal.classList.remove('active');
            overlay.classList.remove('active');
        });
    } else {
        console.error('closeModal not found in DOM');
    }

    // Product actions (edit/delete)
    productGrid.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        if (!productId) return;

        if (e.target.classList.contains('edit-btn')) {
            console.log('Edit button clicked, ID:', productId);
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
                document.getElementById('productImage1').value = product.images[0]?.replace('../../Images/', '') || '';
                document.getElementById('productImage2').value = product.images[1]?.replace('../../Images/', '') || '';
                document.getElementById('productImage3').value = product.images[2]?.replace('../../Images/', '') || '';
                document.getElementById('productImage4').value = product.images[3]?.replace('../../Images/', '') || '';
                document.getElementById('productImage5').value = product.images[4]?.replace('../../Images/', '') || '';
                document.getElementById('specMaterial').value = product.specifications.material;
                document.getElementById('specCompatibility').value = product.specifications.compatibility;
                document.getElementById('specWarranty').value = product.specifications.warranty;
                document.getElementById('productForm').dataset.productId = productId;
                console.log('editModal active for edit:', editModal.classList.contains('active'));
                console.log('editModal styles:', {
                    display: editModal.style.display,
                    opacity: editModal.style.opacity
                });
            } else {
                console.error('Product not found for edit, ID:', productId);
            }
        } else if (e.target.classList.contains('delete-btn')) {
            console.log('Delete button clicked, ID:', productId);
            if (confirm('Вы уверены, что хотите удалить этот продукт?')) {
                let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
                localProducts = localProducts.filter(p => p.id !== productId);
                localStorage.setItem('products', JSON.stringify(localProducts));
                products = Array.from(new Map([...jsonProducts, ...localProducts].map(p => [p.id, p])).values())
    .filter(p => p.status !== 'rejected');
                console.log('Products after delete:', products);
                renderProducts(products);
                window.location.reload();
            }
        }
    });

    // Logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            console.log('Logout button clicked');
            localStorage.removeItem('userData');
            window.location.href = '../../auth/index.html';
        });
    } else {
        console.error('logout-btn not found in DOM');
    }

    // Load orders (seller)
    let orders = [];
    try {
        const response = await fetch('http://localhost:8000/seller/orders?sellerId=' + encodeURIComponent(userData.id));
        const orders = await response.json();
    } catch (e) {
        console.error('Error loading orders:', e);
    }
});