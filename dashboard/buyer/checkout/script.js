document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const deliveryForm = document.getElementById('deliveryForm');
    const cardPayment = document.getElementById('cardPayment');
    const codPayment = document.getElementById('codPayment');
    const cardDetails = document.getElementById('cardDetails');
    const codDetails = document.getElementById('codDetails');
    const qrCode = document.getElementById('qrCode');
    const paymentAmount = document.getElementById('paymentAmount');
    const orderItems = document.getElementById('orderItems');
    const orderSubtotal = document.getElementById('orderSubtotal');
    const orderShipping = document.getElementById('orderShipping');
    const orderTotal = document.getElementById('orderTotal');
    const citySelect = document.getElementById('city');
    const submitOrderBtn = document.querySelector('.submit-order');

    // State variables
    let currentDistance = 0;
    let isProcessing = false;

    // Load user data
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    // Load order summary with validation
    let orderSummary;
    try {
        orderSummary = JSON.parse(localStorage.getItem('orderSummary') || '{}');
        if (!orderSummary.items || !Array.isArray(orderSummary.items)) {
            throw new Error('Invalid order data');
        }
    } catch (e) {
        console.error('Error loading order summary:', e);
        window.location.href = '../cart/index.html';
        return;
    }

    // Initialize the page
    initPage();

    function initPage() {
        updateOrderSummary();
        setupPaymentMethods();
        setupFormValidation();
        setDefaultDeliveryDate();
    }

    function updateOrderSummary() {
        orderItems.innerHTML = '';
        orderSummary.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            itemElement.innerHTML = `
                <div class="order-item-image">
                    <img src="${item.images[0]}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100'">
                </div>
                <div class="order-item-details">
                    <h4>${item.name}</h4>
                    <p>${item.quantity} × ${item.price.toLocaleString('ru-RU')} ₽</p>
                    <p>${(item.price * item.quantity).toLocaleString('ru-RU')} ₽</p>
                </div>
            `;
            orderItems.appendChild(itemElement);
        });

        orderSubtotal.textContent = orderSummary.subtotal.toLocaleString('ru-RU') + ' ₽';
        orderShipping.textContent = orderSummary.shipping.toLocaleString('ru-RU') + ' ₽';
        orderTotal.textContent = orderSummary.total.toLocaleString('ru-RU') + ' ₽';
    }

    function setupPaymentMethods() {
        cardPayment.checked = true;
        cardDetails.style.display = 'block';
        codDetails.style.display = 'none';

        cardPayment.addEventListener('change', function() {
            cardDetails.style.display = this.checked ? 'block' : 'none';
            codDetails.style.display = this.checked ? 'none' : 'block';
            if (!this.checked) updateCodPaymentDetails();
        });

        codPayment.addEventListener('change', function() {
            cardDetails.style.display = 'none';
            codDetails.style.display = 'block';
            updateCodPaymentDetails();
        });
    }

    function setupFormValidation() {
        document.getElementById('cardNumber')?.addEventListener('input', formatCardNumber);
        document.getElementById('cardExpiry')?.addEventListener('input', formatCardExpiry);
        deliveryForm.addEventListener('submit', handleFormSubmit);
    }

    function formatCardNumber(e) {
        let value = e.target.value.replace(/\s+/g, '');
        if (value.length > 16) value = value.substr(0, 16);
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        e.target.value = value;
    }

    function formatCardExpiry(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.substr(0, 4);
        if (value.length > 2) {
            value = value.replace(/^(\d{2})/, '$1/');
        }
        e.target.value = value;
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        if (isProcessing) return;
        isProcessing = true;
        submitOrderBtn.disabled = true;
        submitOrderBtn.textContent = 'Обработка...';

        try {
            if (!validateForm()) {
                throw new Error('Пожалуйста, заполните все обязательные поля корректно');
            }

            const order = createOrderObject();
            console.log('Создан заказ:', order);

            const paymentSuccess = await processPayment(order);
            if (!paymentSuccess) {
                throw new Error('Ошибка обработки платежа');
            }

            saveOrderToHistory(order);
            localStorage.removeItem('cart');
            localStorage.removeItem('orderSummary');
            
            window.location.href = '../order/order-history.html';
        } catch (error) {
            console.error('Ошибка оформления заказа:', error);
            alert(error.message);
            isProcessing = false;
            submitOrderBtn.disabled = false;
            submitOrderBtn.textContent = 'Оформить заказ';
        }
    }

    function validateForm() {
        const requiredFields = [
            'fullName', 'phone', 'email', 'city', 'address', 'deliveryDate'
        ];

        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                if (field) field.focus();
                return false;
            }
        }

        const email = document.getElementById('email').value;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Пожалуйста, введите корректный email');
            document.getElementById('email').focus();
            return false;
        }

        const phone = document.getElementById('phone').value;
        if (!/^[\d\s\-\+\(\)]{11,}$/.test(phone)) {
            alert('Пожалуйста, введите корректный номер телефона');
            document.getElementById('phone').focus();
            return false;
        }

        // Only validate card details if card payment is selected
        if (cardPayment.checked) {
            const cardNumber = document.getElementById('cardNumber')?.value.replace(/\s/g, '') || '';
            const cardExpiry = document.getElementById('cardExpiry')?.value || '';
            const cardCvv = document.getElementById('cardCvv')?.value || '';

            if (cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
                alert('Пожалуйста, введите корректный номер карты (16 цифр)');
                document.getElementById('cardNumber')?.focus();
                return false;
            }

            if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
                alert('Пожалуйста, введите корректный срок действия карты (ММ/ГГ)');
                document.getElementById('cardExpiry')?.focus();
                return false;
            }

            if (!/^\d{3,4}$/.test(cardCvv)) {
                alert('Пожалуйста, введите корректный CVV код (3-4 цифры)');
                document.getElementById('cardCvv')?.focus();
                return false;
            }
        }

        return true;
    }

    function createOrderObject() {
        const paymentMethod = cardPayment.checked ? 'card' : 'cod';
        const now = new Date();

        return {
            ...orderSummary,
            orderNumber: 'ORD-' + now.getTime().toString().slice(-6),
            status: paymentMethod === 'card' ? 'Оплачено' : 'Ожидает оплаты',
            date: now.toISOString(),
            paymentMethod,
            customer: {
                fullName: document.getElementById('fullName').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                city: document.getElementById('city').value,
                address: document.getElementById('address').value.trim()
            },
            paymentAmount: orderSummary.total * (paymentMethod === 'cod' ? 1.02 : 1)
        };
    }

    async function processPayment(order) {
        try {
            // Simulate payment processing only for card payments
            if (order.paymentMethod === 'card') {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            return true;
        } catch (error) {
            console.error('Payment processing error:', error);
            return false;
        }
    }

    function saveOrderToHistory(order) {
        try {
            let orders = [];
            const ordersData = localStorage.getItem('orders');
            
            if (ordersData && ordersData.trim() !== '') {
                orders = JSON.parse(ordersData);
                if (!Array.isArray(orders)) {
                    console.warn('Orders data was corrupted, resetting to empty array');
                    orders = [];
                }
            }
            
            orders.unshift(order);
            localStorage.setItem('orders', JSON.stringify(orders));
            console.log('Order successfully saved to history');
            return true;
        } catch (error) {
            console.error('Failed to save order to history:', error);
            localStorage.setItem('orders', JSON.stringify([order]));
            return true;
        }
    }

    function updateCodPaymentDetails() {
        const codTotal = Math.round(orderSummary.total * 1.02);
        paymentAmount.textContent = codTotal.toLocaleString('ru-RU') + ' ₽';
        generateQRCode(`COD-${Date.now().toString().slice(-6)}`);
    }

    async function generateQRCode(data) {
        try {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
            const img = document.createElement('img');
            img.src = qrUrl;
            img.alt = "QR код для оплаты";
            qrCode.innerHTML = '';
            qrCode.appendChild(img);
        } catch (error) {
            console.error('QR generation error:', error);
            qrCode.innerHTML = `<div class="qr-fallback">Код оплаты: ${data}</div>`;
        }
    }

    function setDefaultDeliveryDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('deliveryDate').valueAsDate = tomorrow;
    }

    if (citySelect) {
        citySelect.addEventListener('change', async function() {
            const city = this.value;
            if (!city) return;

            try {
                currentDistance = await calculateDistanceFromMoscow(city);
                updateShippingCost();
            } catch (error) {
                console.error('Distance calculation error:', error);
            }
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

    function updateShippingCost() {
        const baseShipping = orderSummary.items.reduce(
            (total, item) => total + (item.weight * item.quantity * 100), 0);
        const distanceCost = currentDistance * 15;
        
        orderSummary.shipping = Math.max(baseShipping + distanceCost, 1000);
        orderSummary.total = orderSummary.subtotal + orderSummary.shipping;
        
        orderShipping.textContent = orderSummary.shipping.toLocaleString('ru-RU') + ' ₽';
        orderTotal.textContent = orderSummary.total.toLocaleString('ru-RU') + ' ₽';
        
        localStorage.setItem('orderSummary', JSON.stringify(orderSummary));
        
        if (codPayment.checked) {
            updateCodPaymentDetails();
        }
    }
});