document.addEventListener('DOMContentLoaded', async function() {
    const orderNumberDisplay = document.getElementById('orderNumber');
    const orderDetails = document.getElementById('orderDetails');
    const processOrderForm = document.getElementById('processOrderForm');
    const newStatusSelect = document.getElementById('newStatus');
    const trackingNumberInput = document.getElementById('trackingNumber');
    const sellerNotesInput = document.getElementById('sellerNotes');
    const userData = JSON.parse(localStorage.getItem('userData') || {});
    
    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    // Get orderNumber from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('orderNumber');
    
    if (!orderNumber) {
        orderDetails.innerHTML = '<p class="error">Номер заказа не указан.</p>';
        return;
    }
    
    orderNumberDisplay.textContent = orderNumber;

    // Normalize status
    function normalizeStatus(status) {
        if (!status || typeof status !== 'string') {
            console.warn('Invalid status, using default: Ожидает оплаты', status);
            return 'Ожидает оплаты';
        }
        const normalized = status.trim().toLowerCase();
        const statusMap = {
            'ожидает оплаты': 'Ожидает оплаты',
            'оплачено': 'Оплачено',
            'в обработке': 'В обработке',
            'отправлено': 'Отправлено',
            'доставлено': 'Доставлено',
            'отменен': 'Отменен',
            'оплата при получении': 'Оплата при получении'
        };
        const result = statusMap[normalized] || 'Ожидает оплаты';
        console.log(`Normalized status: "${status}" -> "${result}"`);
        return result;
    }

    // Load order details
    let order;
    async function loadOrder() {
        try {
            const response = await fetch('../../buyer/data/orders.json');
            if (!response.ok) throw new Error('Failed to load orders.json');
            let jsonOrders = await response.json();
            jsonOrders = jsonOrders.map(o => ({
                ...o,
                status: normalizeStatus(o.status)
            }));
            
            let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            localOrders = localOrders.map(o => ({
                ...o,
                status: normalizeStatus(o.status)
            }));
            
            const allOrders = [...jsonOrders, ...localOrders];
            order = allOrders.find(o => o.orderNumber === orderNumber);
            
            if (!order) {
                orderDetails.innerHTML = '<p class="error">Заказ не найден.</p>';
                return;
            }
            
            renderOrderDetails(order);
            updateFormBasedOnStatus(order);
        } catch (e) {
            console.error('Error loading order:', e);
            orderDetails.innerHTML = '<p class="error">Ошибка при загрузке заказа.</p>';
        }
    }

    // Update form based on current status (sequential status changes)
    function updateFormBasedOnStatus(order) {
        trackingNumberInput.value = order.trackingNumber || '';
        sellerNotesInput.value = order.sellerNotes || '';

        if (order.status === 'Оплачено' || order.status === 'Оплата при получении') {
            newStatusSelect.innerHTML = `
                <option value="В обработке">В обработке</option>
            `;
            trackingNumberInput.disabled = true;
        } else if (order.status === 'В обработке') {
            newStatusSelect.innerHTML = `
                <option value="Отправлено">Отправлено</option>
            `;
            trackingNumberInput.disabled = false;
        } else if (order.status === 'Отправлено') {
            newStatusSelect.innerHTML = `
                <option value="Доставлено">Доставлено</option>
            `;
            trackingNumberInput.disabled = true; // Tracking number is locked after Отправлено
        } else {
            // For other statuses (e.g., Ожидает оплаты, Отменен), disable form
            newStatusSelect.innerHTML = `<option value="">Нет доступных статусов</option>`;
            newStatusSelect.disabled = true;
            trackingNumberInput.disabled = true;
            sellerNotesInput.disabled = true;
            document.querySelector('.submit-btn').disabled = true;
        }
    }

    // Construct image path for order items
    function getItemImagePath(item) {
        if (Array.isArray(item.images) && item.images.length > 0) {
            const imageName = item.images[0].split('/').pop();
            return `../../../Images/${item.name}/${imageName}`;
        }
        return 'https://via.placeholder.com/80?text=No+Image';
    }

    // Render order details
    function renderOrderDetails(order) {
        orderDetails.innerHTML = `
            <div class="order-info-grid">
                <div class="order-info-section">
                    <h3>Информация о клиенте</h3>
                    <p><strong>Полное имя:</strong> ${order.customer.fullName}</p>
                    <p><strong>Телефон:</strong> ${order.customer.phone}</p>
                    <p><strong>Email:</strong> ${order.customer.email}</p>
                    <p><strong>Адрес доставки:</strong> ${order.customer.city}, ${order.customer.address}</p>
                    <p><strong>Дата доставки:</strong> ${formatDate(order.deliveryDate)}</p>
                </div>
                
                <div class="order-info-section">
                    <h3>Детали оплаты</h3>
                    <p><strong>Способ оплаты:</strong> ${getPaymentMethodName(order.paymentMethod)}</p>
                    <p><strong>Статус оплаты:</strong> ${order.paymentMethod === 'card' ? 'Оплачено' : order.status === 'Доставлено' ? 'Оплачено при получении' : 'Ожидает оплаты'}</p>
                    <p><strong>Сумма заказа:</strong> ${order.subtotal.toLocaleString('ru-RU')} ₽</p>
                    <p><strong>Доставка:</strong> ${order.shipping.toLocaleString('ru-RU')} ₽</p>
                    <p class="order-total"><strong>Итого:</strong> ${order.paymentAmount.toLocaleString('ru-RU')} ₽</p>
                </div>
            </div>
            
            <div class="order-items">
                <h3>Товары в заказе:</h3>
                ${order.items.map(item => `
                    <div class="order-item">
                        <div class="item-image">
                            <img src="${getItemImagePath(item)}" alt="${item.name}" 
                                 onerror="this.onerror=null;this.src='https://via.placeholder.com/80?text=No+Image'">
                        </div>
                        <div class="item-info">
                            <h4>${item.name}</h4>
                            <p>${item.brand} ${item.model}</p>
                            <p>${item.quantity} × ${item.price.toLocaleString('ru-RU')} ₽</p>
                        </div>
                        <div class="item-total">
                            ${(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                        </div>
                    </div>
                `).join('')}
            </div>
            ${order.trackingNumber ? `
                <div class="order-tracking">
                    <h3>Информация об отслеживании</h3>
                    <p><strong>Номер отслеживания:</strong> ${order.trackingNumber}</p>
                </div>
            ` : ''}
            ${order.sellerNotes ? `
                <div class="order-notes">
                    <h3>Примечания продавца</h3>
                    <p>${order.sellerNotes}</p>
                </div>
            ` : ''}
        `;
    }

    // Helper functions
    function formatDate(dateString) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    }

    function getPaymentMethodName(method) {
        return method === 'card' ? 'Картой онлайн' : 'Наложенный платеж (при получении)';
    }

    function updateOrderStatus(orderNumber, newStatus, trackingNumber, sellerNotes) {
        try {
            let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            const updatedOrders = localOrders.map(o => 
                o.orderNumber === orderNumber ? { 
                    ...o, 
                    status: newStatus,
                    trackingNumber: trackingNumber || o.trackingNumber,
                    sellerNotes: sellerNotes || o.sellerNotes
                } : o
            );
            localStorage.setItem('orders', JSON.stringify(updatedOrders));
            alert('Статус заказа успешно обновлен!');
            // Redirect to appropriate page based on new status
            if (newStatus === 'Отправлено' || newStatus === 'Доставлено') {
                window.location.href = '../shipping/index.html';
            } else {
                window.location.href = '../order/index.html';
            }
        } catch (e) {
            console.error('Error updating order status:', e);
            alert('Ошибка при обновлении статуса заказа');
        }
    }

    // Form submission
    processOrderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const newStatus = newStatusSelect.value;
        const trackingNumber = trackingNumberInput.value;
        const sellerNotes = sellerNotesInput.value;

        if (newStatus === 'Отправлено' && !trackingNumber) {
            alert('Пожалуйста, укажите номер отслеживания для статуса "Отправлено".');
            return;
        }

        if (newStatus === 'Доставлено') {
            const firstConfirm = confirm('Вы уверены, что хотите подтвердить доставку заказа? Для заказов с оплатой при получении убедитесь, что оплата получена!');
            if (firstConfirm) {
                const secondConfirm = confirm('ВНИМАНИЕ: После подтверждения доставки заказ считается завершенным, и изменить статус будет невозможно. Для заказов с оплатой при получении это означает, что вы подтверждаете получение оплаты. Продолжить?');
                if (secondConfirm) {
                    updateOrderStatus(orderNumber, newStatus, trackingNumber, sellerNotes);
                }
            }
        } else {
            if (confirm(`Подтвердить обновление статуса заказа на "${newStatus}"?`)) {
                updateOrderStatus(orderNumber, newStatus, trackingNumber, sellerNotes);
            }
        }
    });

    // Logout
    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../../auth/index.html';
    });

    // Initial load
    loadOrder();
});