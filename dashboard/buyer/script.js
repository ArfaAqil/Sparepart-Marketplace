document.addEventListener('DOMContentLoaded', function() {
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

    // Mock product data with all filter parameters
    const products = [
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
            description: "Высококачественные тормозные колодки для Toyota Corolla 2015-2023. Обеспечивают отличное торможение и долгий срок службы.",
            images: ["https://via.placeholder.com/500x300?text=Toyota+Brakes", "https://via.placeholder.com/500x300?text=Toyota+Brakes+2"],
            specifications: {
                material: "Керамика",
                compatibility: "Toyota Corolla 2015-2023",
                warranty: "2 года"
            }
        },
        {
            id: 2,
            name: "Масло моторное 5W-30 Lada Vesta",
            brand: "Lada",
            model: "Vesta",
            year: 2018,
            price: 3500,
            weight: 4.0,
            category: "Смазки",
            condition: "new",
            inStock: true,
            hasWarranty: false,
            sellerRating: 4.2,
            description: "Синтетическое моторное масло 5W-30 для Lada Vesta. Оптимально для всех сезонов.",
            images: ["https://via.placeholder.com/500x300?text=Lada+Oil", "https://via.placeholder.com/500x300?text=Lada+Oil+2"],
            specifications: {
                type: "Синтетическое",
                volume: "4 литра",
                viscosity: "5W-30"
            }
        },
        {
            id: 3,
            name: "Амортизатор передний Honda Civic",
            brand: "Honda",
            model: "Civic",
            year: 2019,
            price: 8900,
            weight: 3.2,
            category: "Подвеска",
            condition: "used",
            inStock: true,
            hasWarranty: true,
            sellerRating: 4.0,
            description: "Амортизаторы передние для Honda Civic 2016-2021. Б/у в отличном состоянии.",
            images: ["https://via.placeholder.com/500x300?text=Honda+Shock", "https://via.placeholder.com/500x300?text=Honda+Shock+2"],
            specifications: {
                condition: "Б/У (отличное состояние)",
                compatibility: "Honda Civic 2016-2021",
                warranty: "6 месяцев"
            }
        },
        {
            id: 4,
            name: "Свечи зажигания BMW X5",
            brand: "BMW",
            model: "X5",
            year: 2021,
            price: 4500,
            weight: 0.5,
            category: "Двигатель",
            condition: "new",
            inStock: false,
            hasWarranty: true,
            sellerRating: 4.7,
            description: "Оригинальные свечи зажигания для BMW X5. Обеспечивают стабильную работу двигателя.",
            images: ["https://via.placeholder.com/500x300?text=BMW+Spark", "https://via.placeholder.com/500x300?text=BMW+Spark+2"],
            specifications: {
                type: "Иридиевые",
                quantity: "6 штук",
                warranty: "1 год"
            }
        },
        {
            id: 5,
            name: "Ремень ГРМ Toyota Camry",
            brand: "Toyota",
            model: "Camry",
            year: 2017,
            price: 6800,
            weight: 1.2,
            category: "Двигатель",
            condition: "used",
            inStock: true,
            hasWarranty: false,
            sellerRating: 3.8,
            description: "Ремень ГРМ для Toyota Camry 2012-2017. Б/у, но в хорошем состоянии.",
            images: ["https://via.placeholder.com/500x300?text=Toyota+Belt", "https://via.placeholder.com/500x300?text=Toyota+Belt+2"],
            specifications: {
                condition: "Б/У (хорошее состояние)",
                compatibility: "Toyota Camry 2012-2017"
            }
        },
        {
            id: 6,
            name: "Воздушный фильтр Lada Granta",
            brand: "Lada",
            model: "Granta",
            year: 2020,
            price: 2800,
            weight: 0.3,
            category: "Фильтры",
            condition: "new",
            inStock: true,
            hasWarranty: false,
            sellerRating: 4.1,
            description: "Воздушный фильтр для Lada Granta. Обеспечивает чистый воздух для двигателя.",
            images: ["https://via.placeholder.com/500x300?text=Lada+Filter", "https://via.placeholder.com/500x300?text=Lada+Filter+2"],
            specifications: {
                type: "Бумажный",
                compatibility: "Lada Granta 2011-2023"
            }
        }
    ];

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
            
            // Highlight selected star and all above it
            stars.forEach((s, index) => {
                if (index <= 5 - rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
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
                <div class="product-image">
                    <span>${product.name}</span>
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
    }

    // Show product modal
    function showProductModal(product) {
        modalBody.innerHTML = `
            <div class="modal-images">
                ${product.images.map(img => `<img src="${img}" alt="${product.name}">`).join('')}
            </div>
            <div class="modal-details">
                <h2>${product.name}</h2>
                <div class="modal-price">${product.price.toLocaleString('ru-RU')} ₽</div>
                <div class="modal-meta">
                    <p><strong>Марка:</strong> ${product.brand}</p>
                    <p><strong>Модель:</strong> ${product.model}</p>
                    <p><strong>Год:</strong> ${product.year}</p>
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
    cartIcon.addEventListener('click', function() {
        window.location.href = 'cart/index.html';
    });

    // Apply filters
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase() || productSearch.value.toLowerCase();
        const selectedBrand = brandFilter.value;
        const selectedModel = modelFilter.value;
        const minYearValue = parseInt(minYear.value) || 1990;
        const maxYearValue = parseInt(maxYear.value) || 2023;
        const maxPriceValue = parseInt(priceSlider.value) || 100000;
        const showNew = newCondition.checked;
        const showUsed = usedCondition.checked;
        const showBrakes = categoryBrakes.checked;
        const showEngine = categoryEngine.checked;
        const showSuspension = categorySuspension.checked;
        const onlyInStock = inStockOnly.checked;
        const onlyWithWarranty = hasWarranty.checked;
        const activeStar = document.querySelector('.stars span.active');
        const minRating = activeStar ? parseInt(activeStar.dataset.rating) : 0;
        
        const filtered = products.filter(product => {
            // Search term
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);
            
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
                (showSuspension && product.category === 'Подвеска');
            
            // Availability
            const matchesAvailability = onlyInStock ? product.inStock : true;
            
            // Warranty
            const matchesWarranty = onlyWithWarranty ? product.hasWarranty : true;
            
            // Rating
            const matchesRating = product.sellerRating >= minRating;
            
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

    // Logout
    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../auth/index.html';
    });

    // Initial render
    renderProducts(products);
});