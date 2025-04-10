document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const filterToggle = document.getElementById('filterToggle');
    const filterSidebar = document.getElementById('filterSidebar');
    const closeFilter = document.querySelector('.close-filter');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    
    // Load user data
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData && userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    // Mock product data
    const products = [
        { id: 1, name: "Тормозные колодки Toyota", brand: "Toyota", year: 2020, price: 12500, category: "Тормоза", condition: "new", inStock: true, rating: 4.5 },
        { id: 2, name: "Масло моторное 5W-30", brand: "Lada", year: 2018, price: 3500, category: "Смазки", condition: "new", inStock: true, rating: 4.2 },
        { id: 3, name: "Амортизатор передний", brand: "Honda", year: 2019, price: 8900, category: "Подвеска", condition: "used", inStock: true, rating: 4.0 },
        { id: 4, name: "Свечи зажигания", brand: "BMW", year: 2021, price: 4500, category: "Двигатель", condition: "new", inStock: false, rating: 4.7 },
        { id: 5, name: "Ремень ГРМ", brand: "Toyota", year: 2017, price: 6800, category: "Двигатель", condition: "used", inStock: true, rating: 3.8 },
        { id: 6, name: "Воздушный фильтр", brand: "Lada", year: 2020, price: 2800, category: "Фильтры", condition: "new", inStock: true, rating: 4.1 }
    ];

    // Filter elements
    const searchInput = document.getElementById('searchInput');
    const productSearch = document.getElementById('productSearch');
    const brandFilter = document.getElementById('brandFilter');
    const minYear = document.getElementById('minYear');
    const maxYear = document.getElementById('maxYear');
    const priceSlider = document.getElementById('priceSlider');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const newCondition = document.getElementById('newCondition');
    const usedCondition = document.getElementById('usedCondition');
    const applyFilter = document.querySelector('.apply-filter');
    const resetFilter = document.querySelector('.reset-filter');

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
                    <button class="add-to-cart">В корзину</button>
                </div>
            `;
            productGrid.appendChild(card);
        });
    }

    // Apply filters
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase() || productSearch.value.toLowerCase();
        const selectedBrand = brandFilter.value;
        const minYearValue = parseInt(minYear.value) || 1990;
        const maxYearValue = parseInt(maxYear.value) || 2023;
        const maxPriceValue = parseInt(priceSlider.value) || 100000;
        const showNew = newCondition.checked;
        const showUsed = usedCondition.checked;
        
        const filtered = products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);
            const matchesBrand = selectedBrand ? product.brand === selectedBrand : true;
            const matchesYear = product.year >= minYearValue && product.year <= maxYearValue;
            const matchesPrice = product.price <= maxPriceValue;
            const matchesCondition = 
                (showNew && product.condition === 'new') || 
                (showUsed && product.condition === 'used');
            
            return matchesSearch && matchesBrand && matchesYear && matchesPrice && matchesCondition;
        });
        
        renderProducts(filtered);
        filterSidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    // Reset filters
    function resetFilters() {
        searchInput.value = '';
        productSearch.value = '';
        brandFilter.value = '';
        minYear.value = '';
        maxYear.value = '';
        priceSlider.value = '50000';
        maxPrice.textContent = '50000';
        newCondition.checked = true;
        usedCondition.checked = true;
        
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