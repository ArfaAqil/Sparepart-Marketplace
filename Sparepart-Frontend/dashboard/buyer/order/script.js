document.addEventListener('DOMContentLoaded', async function() {
    const orderList = document.getElementById('orderList');
    const cartCounter = document.getElementById('cartCounter');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const response = await fetch('http://localhost:8000/orders?userId=' + encodeURIComponent(userData.id));
    const orders = await response.json();

    // Update cart counter
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        cartCounter.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    } catch (e) {
        console.error('Error loading cart:', e);
        cartCounter.textContent = '0';
    }

    // Set username if available
    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    // Valid status values for order history
    const validStatuses = [
        'Ожидает оплаты',
        'Оплачено',
        'Оплата при получении',
        'В обработке',
        'Отменен'
    ];

    // Normalize status
    function normalizeStatus(status) {
        if (!status || typeof status !== 'string') {
            console.warn('Invalid or missing status, skipping order:', status);
            return null;
        }
        const normalized = status.trim().toLowerCase();
        const statusMap = {
            'ожидает оплаты': 'Ожидает оплаты',
            'оплачено': 'Оплачено',
            'оплата при получении': 'Оплата при получении',
            'в обработке': 'В обработке',
            'отменен': 'Отменен'
        };
        const result = statusMap[normalized];
        if (!result) {
            console.warn(`Status "${status}" is not valid for order history, skipping order`);
            return null;
        }
        return result;
    }

    // --- Загрузка заказов пользователя с сервера ---
    let orders = [];
    try {
        const response = await fetch('http://localhost:8000/orders?userId=' + encodeURIComponent(userData.id));
        if (!response.ok) throw new Error('Ошибка загрузки заказов');
        let jsonOrders = await response.json();

        // Normalize statuses and filter invalid ones
        jsonOrders = jsonOrders
            .map(order => ({
                ...order,
                status: normalizeStatus(order.status)
            }))
            .filter(order => order.status !== null);

        const validStatuses = [
            'Ожидает оплаты',
            'Оплачено',
            'Оплата при получении',
            'В обработке',
            'Отменен'
        ];
        orders = jsonOrders.filter(order => validStatuses.includes(order.status));
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
        console.error('Error loading orders:', e);
        orders = [];
    }

    if (orders.length === 0) {
        orderList.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-box-open"></i>
                <p>У вас пока нет заказов</p>
                <a href="../index.html" class="back-btn">Вернуться в каталог</a>
            </div>
        `;
        return;
    }

    function getItemImagePath(item) {
        if (Array.isArray(item.images) && item.images.length > 0) {
            const imageName = item.images[0].split('/').pop();
            return `../../../Images/${item.name}/${imageName}`;
        }
        return 'https://via.placeholder.com/80?text=No+Image';
    }

    // Render orders with detailed information
    orderList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header" onclick="toggleOrderDetails(this)">
                <div class="order-meta">
                    <span class="order-number">Заказ #${order.orderNumber}</span>
                    <span class="order-date">${formatDate(order.date)}</span>
                    <span class="order-status ${getStatusClass(order.status)}">
                        ${order.status}
                    </span>
                </div>
                <div class="order-summary">
                    <span>${order.items.length} товар(ов)</span>
                    <span class="order-total">${order.paymentAmount.toLocaleString('ru-RU')} ₽</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
            
            <div class="order-details">
                <div class="order-items">
                    <h3>Состав заказа:</h3>
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
                
                <div class="order-info-grid">
                    <div class="order-info-section">
                        <h3>Информация о доставке</h3>
                        <p><strong>Получатель:</strong> ${order.customer.fullName}</p>
                        <p><strong>Адрес:</strong> ${order.customer.city}, ${order.customer.address}</p>
                        <p><strong>Дата доставки:</strong> ${formatDate(order.deliveryDate)}</p>
                        <p><strong>Способ оплаты:</strong> ${getPaymentMethodName(order.paymentMethod)}</p>
                    </div>
                    
                    <div class="order-info-section">
                        <h3>Стоимость заказа</h3>
                        <p><strong>Товары:</strong> ${order.subtotal.toLocaleString('ru-RU')} ₽</p>
                        <p><strong>Доставка:</strong> ${order.shipping.toLocaleString('ru-RU')} ₽</p>
                        ${order.paymentMethod === 'cod' ? 
                          `<p><strong>Комиссия за наложенный платеж:</strong> ${(order.paymentAmount - order.subtotal - order.shipping).toLocaleString('ru-RU')} ₽</p>` : ''}
                        <p class="order-total"><strong>Итого:</strong> ${order.paymentAmount.toLocaleString('ru-RU')} ₽</p>
                    </div>
                </div>
                
                <div class="order-actions">
                    <button class="btn cancel-order-btn" data-order="${order.orderNumber}" 
                        ${order.status === 'Отменен' || order.status === 'В обработке' ? 'disabled' : ''}>
                        ${order.status === 'Отменен' ? 'Заказ отменен' : 'Отменить заказ'}
                    </button>
                    <button class="btn delete-order-btn" data-order="${order.orderNumber}">
                        Удалить заказ
                    </button>
                    <a href="../index.html" class="btn back-to-catalog-btn">
                        Вернуться в каталог
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners
    orderList.addEventListener('click', async function(e) {
        const orderId = e.target.dataset.order;
        if (!orderId) return;
        
        if (e.target.classList.contains('cancel-order-btn')) {
            await cancelOrder(orderId);
        } else if (e.target.classList.contains('delete-order-btn')) {
            await deleteOrder(orderId);
        }
    });

    // Helper functions
    window.toggleOrderDetails = function(element) {
        const card = element.closest('.order-card');
        const details = card.querySelector('.order-details');
        const icon = element.querySelector('.fa-chevron-down');
        
        details.classList.toggle('show');
        icon.classList.toggle('rotate');
    };

    function formatDate(dateString) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    }

    function getStatusClass(status) {
        const statusClasses = {
            'Ожидает оплаты': 'pending',
            'Оплачено': 'paid',
            'Оплата при получении': 'cod',
            'В обработке': 'processing',
            'Отменен': 'cancelled'
        };
        return statusClasses[status] || '';
    }

    function getPaymentMethodName(method) {
        return method === 'card' ? 'Картой онлайн' : 'Наложенный платеж (при получении)';
    }

    async function cancelOrder(orderId) {
        if (confirm('Вы уверены, что хотите отменить этот заказ?')) {
            try {
                const response = await fetch('http://localhost:8000/orders/cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderNumber: orderId, userId: userData.id })
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    window.location.reload();
                } else {
                    alert(data.message || 'Ошибка при отмене заказа');
                }
            } catch (e) {
                console.error('Error canceling order:', e);
                alert('Ошибка при отмене заказа');
            }
        }
    }

    async function deleteOrder(orderId) {
        if (confirm('Вы уверены, что хотите удалить этот заказ из истории?')) {
            try {
                const response = await fetch('http://localhost:8000/orders/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderNumber: orderId, userId: userData.id })
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    window.location.reload();
                } else {
                    alert(data.message || 'Ошибка при удалении заказа');
                }
            } catch (e) {
                console.error('Error deleting order:', e);
                alert('Ошибка при удалении заказа');
            }
        }
    }
});