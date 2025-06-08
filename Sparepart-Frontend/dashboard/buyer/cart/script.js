// cart/script.js - Complete Integrated Solution
document.addEventListener('DOMContentLoaded', function() {
    console.log('Cart and Checkout system initialized');

    // ==============================================
    // CART PAGE FUNCTIONALITY
    // ==============================================

    // DOM Elements for Cart Page
    const cartItemsContainer = document.getElementById('cartItems');
    const cartSubtotal = document.getElementById('subtotal');
    const cartShipping = document.getElementById('shipping');
    const cartTotal = document.getElementById('total');
    const cartCounter = document.getElementById('cartCounter');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const citySelectCart = document.getElementById('city');

    let currentDistance = 0;

    // Загружаем корзину из localStorage (можно заменить на fetch, если корзина хранится на сервере)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    function displayCartItems() {
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Ваша корзина пуста</p>';
            updateTotals();
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            const firstImagePath = `/dashboard/buyer/${item.images[0]}`;
            itemElement.innerHTML = `
                <div class="cart-item-image-container">
                    <div class="cart-item-image">
                        <img src="${firstImagePath}" alt="${item.name}" 
                            onerror="this.onerror=null;this.src='https://via.placeholder.com/100?text=No+Image'">
                    </div>
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>${item.price.toLocaleString('ru-RU')} ₽</p>
                    <div class="quantity-controls">
                        <button class="decrease-quantity" data-index="${index}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase-quantity" data-index="${index}">+</button>
                    </div>
                    <button class="remove-item" data-index="${index}">Удалить</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        updateTotals();
        if (checkoutBtn) checkoutBtn.disabled = false;
    }

    function updateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const baseShipping = cart.reduce((sum, item) => sum + (item.weight * item.quantity * 100), 0);
        const distanceCost = currentDistance * 15;
        const shipping = Math.max(baseShipping + distanceCost, 1000);
        const total = subtotal + shipping;

        if (cartSubtotal) cartSubtotal.textContent = subtotal.toLocaleString('ru-RU') + ' ₽';
        if (cartShipping) cartShipping.textContent = shipping.toLocaleString('ru-RU') + ' ₽';
        if (cartTotal) cartTotal.textContent = total.toLocaleString('ru-RU') + ' ₽';

        localStorage.setItem('orderSummary', JSON.stringify({
            items: cart,
            subtotal,
            shipping,
            total
        }));
    }

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('increase-quantity')) {
            const index = e.target.dataset.index;
            cart[index].quantity += 1;
            updateCart();
        }
        if (e.target.classList.contains('decrease-quantity')) {
            const index = e.target.dataset.index;
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
                updateCart();
            }
        }
        if (e.target.classList.contains('remove-item')) {
            const index = e.target.dataset.index;
            cart.splice(index, 1);
            updateCart();
        }
    });

    function updateCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems();
        const headerCounter = document.getElementById('cartCounter');
        if (headerCounter) {
            headerCounter.textContent = cart.reduce((total, item) => total + item.quantity, 0);
        }
    }

    if (citySelectCart) {
        citySelectCart.addEventListener('change', async function() {
            const city = this.value;
            if (!city) return;
            try {
                currentDistance = await calculateDistanceFromMoscow(city);
                updateTotals();
            } catch (error) {
                console.error('Distance calculation error:', error);
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            updateTotals(); // обязательно обновить orderSummary перед переходом
            window.location.href = '../checkout/index.html';
        });
    }

    async function calculateDistanceFromMoscow(city) {
        const cityDistances = {
            'Москва': 0,
            'Санкт-Петербург': 700,
            'Казань': 800,
            'Новосибирск': 3300,
            'Екатеринбург': 1800,
            'Ростов-на-Дону': 1200,
            'Владивосток': 9000
        };
        await new Promise(resolve => setTimeout(resolve, 500));
        return cityDistances[city] || 0;
    }

    // Initialize the appropriate page
    if (window.location.pathname.includes('/cart/')) {
        displayCartItems();
    }

    // Seller order fetching example (to be integrated as needed)
    async function fetchSellerOrders() {
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (!userData.id) throw new Error('User ID not found');

            const response = await fetch('http://localhost:8000/seller/orders?sellerId=' + encodeURIComponent(userData.id));
            const orders = await response.json();

            console.log('Fetched seller orders:', orders);
            // Здесь можно обработать и отобразить заказы продавца

        } catch (error) {
            console.error('Error fetching seller orders:', error);
        }
    }

    // Пример вызова функции получения заказов продавца
    // fetchSellerOrders();
});