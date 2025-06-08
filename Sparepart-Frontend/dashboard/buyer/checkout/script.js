document.addEventListener('DOMContentLoaded', function() {
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

    const orderSubtotal = document.getElementById('orderSubtotal');
    const orderShipping = document.getElementById('orderShipping');
    const orderTotal = document.getElementById('orderTotal');

    if (orderSubtotal && orderSummary.subtotal !== undefined)
        orderSubtotal.textContent = orderSummary.subtotal.toLocaleString('ru-RU') + ' ₽';
    if (orderShipping && orderSummary.shipping !== undefined)
        orderShipping.textContent = orderSummary.shipping.toLocaleString('ru-RU') + ' ₽';
    if (orderTotal && orderSummary.total !== undefined)
        orderTotal.textContent = orderSummary.total.toLocaleString('ru-RU') + ' ₽';
});

document.addEventListener('DOMContentLoaded', function() {
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

    let currentDistance = 0;
    let isProcessing = false;

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    const orderSummary = JSON.parse(localStorage.getItem('orderSummary') || '{}');
    if (orderSubtotal) orderSubtotal.textContent = orderSummary.subtotal.toLocaleString('ru-RU') + ' ₽';
    if (orderShipping) orderShipping.textContent = orderSummary.shipping.toLocaleString('ru-RU') + ' ₽';
    if (orderTotal) orderTotal.textContent = orderSummary.total.toLocaleString('ru-RU') + ' ₽';

    initPage();

    function initPage() {
        updateOrderSummary();
        setupPaymentMethods();
        setupFormValidation();
        setDefaultDeliveryDate();
        populateUserData();
    }

    function populateUserData() {
        if (userData.fullName) document.getElementById('fullName').value = userData.fullName;
        if (userData.phone) document.getElementById('phone').value = userData.phone;
        if (userData.email) document.getElementById('email').value = userData.email;
    }

    function updateOrderSummary() {
        if (!orderItems) return;
        orderItems.innerHTML = '';
        orderSummary.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            const firstImagePath = `/dashboard/buyer/${item.images[0]}`;
            itemElement.innerHTML = `
                <div class="order-item-image-container">
                    <div class="order-item-image">
                        <img src="${firstImagePath}" alt="${item.name}" 
                            onerror="this.onerror=null;this.src='https://via.placeholder.com/80?text=No+Image'">
                    </div>
                </div>
                <div class="order-item-details">
                    <h4>${item.name}</h4>
                    <p>${item.quantity} × ${item.price.toLocaleString('ru-RU')} ₽</p>
                    <p>${(item.price * item.quantity).toLocaleString('ru-RU')} ₽</p>
                </div>
            `;
            orderItems.appendChild(itemElement);
        });

        if (orderSubtotal) orderSubtotal.textContent = orderSummary.subtotal.toLocaleString('ru-RU') + ' ₽';
        if (orderShipping) orderShipping.textContent = orderSummary.shipping.toLocaleString('ru-RU') + ' ₽';
        if (orderTotal) orderTotal.textContent = orderSummary.total.toLocaleString('ru-RU') + ' ₽';
    }

    function setupPaymentMethods() {
        if (!cardPayment || !codPayment || !cardDetails || !codDetails) return;

        cardPayment.checked = true;
        cardDetails.style.display = 'block';
        codDetails.style.display = 'none';
        toggleCardDetailsRequired(true);

        cardPayment.addEventListener('change', function() {
            cardDetails.style.display = this.checked ? 'block' : 'none';
            codDetails.style.display = this.checked ? 'none' : 'block';
            toggleCardDetailsRequired(this.checked);
            if (!this.checked) updateCodPaymentDetails();
        });

        codPayment.addEventListener('change', function() {
            cardDetails.style.display = 'none';
            codDetails.style.display = 'block';
            toggleCardDetailsRequired(false);
            updateCodPaymentDetails();
        });
    }

    function toggleCardDetailsRequired(required) {
        const cardFields = ['cardNumber', 'cardExpiry', 'cardCvv'];
        cardFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.required = required;
        });
    }

    function setupFormValidation() {
        if (!deliveryForm) return;

        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', formatCardNumber);
        }

        const cardExpiryInput = document.getElementById('cardExpiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', formatCardExpiry);
        }

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

    function hasMultipleSellers(items) {
        if (!items || items.length === 0) return false;
        const firstSellerId = items[0].sellerId;
        return items.some(item => item.sellerId !== firstSellerId);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        if (isProcessing) return;
        isProcessing = true;
        if (submitOrderBtn) {
            submitOrderBtn.disabled = true;
            submitOrderBtn.textContent = 'Обработка...';
        }

        try {
            if (!validateForm()) {
                throw new Error('Пожалуйста, заполните все обязательные поля корректно');
            }

            // --- ВАЖНО: Проверка на несколько продавцов ---
            if (hasMultipleSellers(orderSummary.items)) {
                alert('В корзине есть товары от разных продавцов. Оформляйте заказы отдельно для каждого продавца.');
                isProcessing = false;
                if (submitOrderBtn) {
                    submitOrderBtn.disabled = false;
                    submitOrderBtn.textContent = 'Оформить заказ';
                }
                return;
            }

            const order = createOrderObject();

            // --- Отправка заказа на сервер ---
            const payload = {
                ...order,
                userId: userData.id || null
            };
            // Для отладки: выведи payload в консоль
            console.log('Отправка заказа:', payload);

            const response = await fetch('http://localhost:8000/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok && data.success) {
                alert('Заказ успешно оформлен!');
                clearCheckoutData();
                window.location.href = '../order/order-history.html';
            } else {
                throw new Error(data.message || 'Ошибка при оформлении заказа');
            }
        } catch (error) {
            console.error('Ошибка оформления заказа:', error);
            alert(error.message);
            isProcessing = false;
            if (submitOrderBtn) {
                submitOrderBtn.disabled = false;
                submitOrderBtn.textContent = 'Оформить заказ';
            }
        }
    }

    function clearCheckoutData() {
        localStorage.removeItem('cart');
        localStorage.removeItem('orderSummary');
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
        if (!/^\+?\d{10,}$/.test(phone.replace(/[\s\-\(\)]/g, ''))) {
            alert('Пожалуйста, введите корректный номер телефона (минимум 10 цифр)');
            document.getElementById('phone').focus();
            return false;
        }

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
            items: orderSummary.items,
            subtotal: orderSummary.subtotal,
            shipping: orderSummary.shipping,
            total: orderSummary.total,
            city: document.getElementById('city').value,
            customer: {
                fullName: document.getElementById('fullName').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                city: document.getElementById('city').value,
                address: document.getElementById('address').value.trim(),
                deliveryDate: document.getElementById('deliveryDate').value
            },
            orderNumber: 'ORD-' + now.getTime().toString().slice(-6),
            status: paymentMethod === 'card' ? 'Оплачено' : 'Оплата при получении',
            date: now.toISOString(),
            paymentMethod,
            paymentAmount: orderSummary.total * (paymentMethod === 'cod' ? 1.02 : 1),
            sellerId: orderSummary.items && orderSummary.items.length > 0 ? orderSummary.items[0].sellerId : null
        };
    }

    function updateCodPaymentDetails() {
        if (!paymentAmount || !qrCode) return;
        const codTotal = Math.round(orderSummary.total * 1.02);
        paymentAmount.textContent = codTotal.toLocaleString('ru-RU') + ' ₽';
        generateQRCode(`COD-${Date.now().toString().slice(-6)}`);
    }

    async function generateQRCode(data) {
        if (!qrCode) return;
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
        const deliveryDateInput = document.getElementById('deliveryDate');
        if (!deliveryDateInput) return;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const formattedDate = tomorrow.toISOString().split('T')[0];
        deliveryDateInput.value = formattedDate;
        deliveryDateInput.min = formattedDate;
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
        return cityDistances[city] || 1000;
    }

    function updateShippingCost() {
        if (!orderSummary?.items) return;

        // Загружаем параметры доставки из localStorage (устанавливает админ)
        const settings = JSON.parse(localStorage.getItem('platformSettings') || '{}');
        const minShippingCost = parseFloat(settings.minShippingCost) ?? 0;
        const weightCoefficient = parseFloat(settings.weightCoefficient) ?? 100;
        const distanceCoefficient = parseFloat(settings.distanceCoefficient) ?? 0;

        console.log('Shipping parameters:', {
            minShippingCost,
            weightCoefficient,
            distanceCoefficient,
            currentDistance
        });

        // Расчёт стоимости доставки
        const baseShipping = orderSummary.items.reduce(
            (total, item) => {
                const weight = parseFloat(item.weight) || 1;
                return total + (weight * item.quantity * weightCoefficient);
            }, 0);

        const distanceCost = currentDistance * distanceCoefficient;
        const totalShippingCost = baseShipping + distanceCost;
        orderSummary.shipping = minShippingCost > 0 ? Math.max(totalShippingCost, minShippingCost) : totalShippingCost;

        orderSummary.total = orderSummary.subtotal + orderSummary.shipping;

        if (orderShipping) orderShipping.textContent = orderSummary.shipping.toLocaleString('ru-RU') + ' ₽';
        if (orderTotal) orderTotal.textContent = orderSummary.total.toLocaleString('ru-RU') + ' ₽';
        localStorage.setItem('orderSummary', JSON.stringify(orderSummary));
        if (codPayment?.checked) updateCodPaymentDetails();
    }

    function hasMultipleSellers(items) {
        if (!items || items.length === 0) return false;
        const firstSellerId = items[0].sellerId;
        return items.some(item => item.sellerId !== firstSellerId);
    }
});