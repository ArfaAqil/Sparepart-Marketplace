document.addEventListener('DOMContentLoaded', async function() {
    // DOM Elements
    const filterToggle = document.getElementById('filterToggle');
    const filterSidebar = document.getElementById('filterSidebar');
    const closeFilter = document.querySelector('.close-filter');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    
    // Modal elements
    const productModal = document.getElementById('productModal');
    const closeModal = document.querySelector('.close-modal');
    const modalBody = document.getElementById('modalBody');
    
    // Cart elements
    const cartIcon = document.getElementById('cartIcon');
    const cartCounter = document.getElementById('cartCounter');
    
    // Load user data
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData && userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    // Load product data from JSON
    let products = [];
    try {
        const response = await fetch('data/products.json');
        if (!response.ok) throw new Error('Failed to load products');
        products = await response.json();
        console.log('Products loaded:', products);
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback minimal product data
        products = [
            {
                id: 1,
                name: "Тормозные колодки Toyota Corolla",
                brand: "Toyota",
                model: "Corolla",
                year: 2020,
                price: 12500,
                weight: 1.5,
                category: "Тормоза",
                condition: "new",
                inStock: true,
                hasWarranty: true,
                sellerRating: 4.5,
                vin: "TOYOTA2020COROLABRAK",
                description: "Высококачественные тормозные колодки для Toyota Corolla",
                images: ["../../Images/Тормозные колодки Toyota Corolla/11.webp"],
                specifications: {
                    material: "Керамика",
                    compatibility: "Toyota Corolla 2015-2023",
                    warranty: "2 года"
                }
            }
        ];
    }

    // Initialize cart
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartCounter();

    // Filter elements
    const searchInput = document.getElementById('searchInput');
    const productSearch = document.getElementById('productSearch');
    const brandFilter = document.getElementById('brandFilter');
    const modelFilter = document.getElementById('modelFilter');
    const minYear = document.getElementById('minYear');
    const maxYear = document.getElementById('maxYear');
    const priceSlider = document.getElementById('priceSlider');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const newCondition = document.getElementById('newCondition');
    const usedCondition = document.getElementById('usedCondition');
    const categoryBrakes = document.getElementById('categoryBrakes');
    const categoryEngine = document.getElementById('categoryEngine');
    const categorySuspension = document.getElementById('categorySuspension');
    const categoryFilter = document.getElementById('categoryFilter');
    const categoryLubrication = document.getElementById('categoryLubrication');
    const inStockOnly = document.getElementById('inStockOnly');
    const hasWarranty = document.getElementById('hasWarranty');
    const applyFilter = document.querySelector('.apply-filter');
    const resetFilter = document.querySelector('.reset-filter');
    const stars = document.querySelectorAll('.stars span');

    // Brand-Model mapping
    const brandModels = {
        'Toyota': ['Corolla', 'Camry', 'RAV4'],
        'Lada': ['Granta', 'Vesta', 'Niva'],
        'Honda': ['Civic', 'Accord', 'CR-V'],
        'BMW': ['X5', '3 Series', '5 Series']
    };

    // Current image index for modal carousel
    let currentImageIndex = 0;

    // Toggle filter sidebar
    filterToggle.addEventListener('click', () => {
        filterSidebar.classList.add('active');
        overlay.classList.add('active');
    });

    closeFilter.addEventListener('click', () => {
        filterSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', () => {
        filterSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Price slider
    priceSlider.addEventListener('input', function() {
        maxPrice.textContent = this.value;
    });

    // Brand-Model relationship
    brandFilter.addEventListener('change', function() {
        modelFilter.innerHTML = '<option value="">Все модели</option>';
        
        if (this.value) {
            modelFilter.disabled = false;
            brandModels[this.value].forEach(model => {
                modelFilter.innerHTML += `<option value="${model}">${model}</option>`;
            });
        } else {
            modelFilter.disabled = true;
        }
    });

    // Star rating selection
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            
            // Toggle active class
            stars.forEach(s => s.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Render products
    function renderProducts(productsToRender) {
        const productGrid = document.getElementById('productGrid');
        productGrid.innerHTML = '';
        
        if (productsToRender.length === 0) {
            productGrid.innerHTML = '<p class="no-results">Ничего не найдено. Попробуйте изменить параметры фильтра.</p>';
            return;
        }
        
        productsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.id = product.id;
            card.innerHTML = `
                <div class="product-image-container">
                    <div class="product-image" id="productImage-${product.id}">
                        <img src="${product.images[0]}" alt="${product.name}" 
                             onerror="this.onerror=null;this.src='https://via.placeholder.com/300x225?text=No+Image'">
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">${product.price.toLocaleString('ru-RU')} ₽</div>
                    <div class="product-meta">
                        <span>${product.brand}, ${product.year}</span>
                        <span>${product.condition === 'new' ? 'Новый' : 'Б/У'}</span>
                    </div>
                    <div class="product-meta">
                        <span>${product.category}</span>
                        <span>${product.hasWarranty ? '✓ Гарантия' : '× Гарантия'}</span>
                    </div>
                    <div class="seller-rating">
                        <span>Продавец: </span>
                        <span class="stars">${'★'.repeat(Math.round(product.sellerRating))}${'☆'.repeat(5 - Math.round(product.sellerRating))}</span>
                        <span>(${product.sellerRating})</span>
                    </div>
                    <button class="add-to-cart">В корзину</button>
                </div>
            `;
            productGrid.appendChild(card);
        });

        // Add event listeners to product cards
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.classList.contains('add-to-cart')) {
                    const productId = parseInt(this.dataset.id);
                    const product = products.find(p => p.id === productId);
                    showProductModal(product);
                }
            });
        });

        // Add event listeners to add-to-cart buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const productId = parseInt(this.closest('.product-card').dataset.id);
                const product = products.find(p => p.id === productId);
                addToCart(product);
            });
        });

        // Detect image orientation after render
        setTimeout(() => {
            productsToRender.forEach(product => {
                const imgContainer = document.getElementById(`productImage-${product.id}`);
                if (imgContainer) {
                    const img = imgContainer.querySelector('img');
                    
                    img.onload = function() {
                        if (this.naturalHeight > this.naturalWidth) {
                            imgContainer.classList.add('portrait');
                        }
                    };
                    
                    if (img.complete) img.onload();
                }
            });
        }, 0);
    }

    // Show product modal with image carousel
    function showProductModal(product) {
        currentImageIndex = 0;
        
        modalBody.innerHTML = `
            <div class="modal-images">
                <div class="main-image-container">
                    <div class="main-image-wrapper">
                        <img src="${product.images[0]}" alt="${product.name}" 
                             class="main-image"
                             onerror="this.onerror=null;this.src='https://via.placeholder.com/800x450?text=No+Image'">
                    </div>
                    <button class="carousel-prev">&lt;</button>
                    <button class="carousel-next">&gt;</button>
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
                <button class="modal-add-to-cart">В корзину</button>
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

        // Add event listener to modal add to cart button
        document.querySelector('.modal-add-to-cart').addEventListener('click', function() {
            addToCart(product);
            productModal.classList.remove('active');
            overlay.classList.remove('active');
        });

        productModal.classList.add('active');
        overlay.classList.add('active');
    }

    // Close modal
    closeModal.addEventListener('click', function() {
        productModal.classList.remove('active');
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', function() {
        productModal.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Add to cart function
    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCounter();
        
        // Show notification
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = `${product.name} добавлен в корзину`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Update cart counter
    function updateCartCounter() {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCounter.textContent = totalItems;
    }

    // Go to cart page
    if (cartIcon) {
        cartIcon.addEventListener('click', function() {
            window.location.href = 'cart/index.html';
        });
    }

    // Apply filters
    function applyFilters() {
        const searchTerm = (searchInput.value || productSearch.value).toLowerCase();
        const selectedBrand = brandFilter.value;
        const selectedModel = modelFilter.value;
        const minYearValue = parseInt(minYear.value) || 1990;
        const maxYearValue = parseInt(maxYear.value) || 2023;
        const maxPriceValue = parseInt(priceSlider.value) || 100000;
        const showNew = newCondition.checked;
        const showUsed = usedCondition.checked;
        const showBrakes = categoryBrakes.checked;
        const showEngine = categoryEngine.checked;
        const showFilter = categoryFilter.checked;
        const showLubrication = categoryLubrication.checked;
        const showSuspension = categorySuspension.checked;
        const onlyInStock = inStockOnly.checked;
        const onlyWithWarranty = hasWarranty.checked;
        const activeStar = document.querySelector('.stars span.active');
        const minRating = activeStar ? parseInt(activeStar.dataset.rating) : 0;
        
        const filtered = products.filter(product => {
            // Search term (name or VIN)
            const matchesSearch = searchTerm 
                ? product.name.toLowerCase().includes(searchTerm) || 
                  product.vin.toLowerCase().includes(searchTerm)
                : true;
            
            // Brand and model
            const matchesBrand = selectedBrand ? product.brand === selectedBrand : true;
            const matchesModel = selectedModel ? product.model === selectedModel : true;
            
            // Year range
            const matchesYear = product.year >= minYearValue && product.year <= maxYearValue;
            
            // Price
            const matchesPrice = product.price <= maxPriceValue;
            
            // Condition
            const matchesCondition = 
                (showNew && product.condition === 'new') || 
                (showUsed && product.condition === 'used');
            
            // Category
            const matchesCategory = 
                (showBrakes && product.category === 'Тормоза') ||
                (showEngine && product.category === 'Двигатель') ||
                (showFilter && product.category === 'Фильтры') ||
                (showLubrication && product.category === 'Смазки') ||
                (showSuspension && product.category === 'Подвеска');
                
            
            // Availability
            const matchesAvailability = onlyInStock ? product.inStock : true;
            
            // Warranty
            const matchesWarranty = onlyWithWarranty ? product.hasWarranty : true;
            
            // Rating
            const matchesRating = minRating === 0 ? true : product.sellerRating >= minRating;
            
            return matchesSearch && matchesBrand && matchesModel && matchesYear && 
                   matchesPrice && matchesCondition && matchesCategory && 
                   matchesAvailability && matchesWarranty && matchesRating;
        });
        
        renderProducts(filtered);
        filterSidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    // Reset filters
    function resetFilters() {
        // Reset all input fields
        searchInput.value = '';
        productSearch.value = '';
        brandFilter.value = '';
        modelFilter.innerHTML = '<option value="">Сначала выберите марку</option>';
        modelFilter.disabled = true;
        minYear.value = '';
        maxYear.value = '';
        priceSlider.value = '50000';
        maxPrice.textContent = '50000';
        newCondition.checked = true;
        usedCondition.checked = true;
        categoryBrakes.checked = true;
        categoryEngine.checked = true;
        categorySuspension.checked = true;
        categoryFilter.checked = true;
        categoryLubrication.checked = true;
        inStockOnly.checked = false;
        hasWarranty.checked = false;
        
        // Reset star rating
        stars.forEach(star => star.classList.remove('active'));
        
        // Render all products
        renderProducts(products);
    }

    // Event listeners
    applyFilter.addEventListener('click', applyFilters);
    resetFilter.addEventListener('click', resetFilters);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') applyFilters();
    });
    productSearch.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') applyFilters();
    });

    // Add click event for search button
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', applyFilters);
    }

    // Logout
    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../auth/index.html';
    });

    // Initial render
    renderProducts(products);
});