document.addEventListener('DOMContentLoaded', async function() {
    const shippingList = document.getElementById('shippingList');
    const cartCounter = document.getElementById('cartCounter');
    const userData = JSON.parse(localStorage.getItem('userData') || {});

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

    // Valid status values for shipping
    const validStatuses = ['Отправлено', 'Доставлено'];

    // Normalize status
    function normalizeStatus(status) {
        if (!status || typeof status !== 'string') {
            console.warn('Invalid or missing status, skipping order:', status);
            return null;
        }
        const normalized = status.trim().toLowerCase();
        const statusMap = {
            'отправлено': 'Отправлено',
            'доставлено': 'Доставлено'
        };
        const result = statusMap[normalized];
        if (!result) {
            console.warn(`Status "${status}" is not valid for shipping, skipping order`);
            return null;
        }
        return result;
    }

    // Load orders
    let orders = [];
    try {
        const response = await fetch('../data/orders.json');
        if (!response.ok) throw new Error('Failed to load orders.json');
        let jsonOrders = await response.json();
        
        // Normalize statuses and filter invalid ones
        jsonOrders = jsonOrders
            .map(order => ({
                ...order,
                status: normalizeStatus(order.status)
            }))
            .filter(order => order.status !== null);
        
        let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        localOrders = localOrders
            .map(order => ({
                ...order,
                status: normalizeStatus(order.status)
            }))
            .filter(order => order.status !== null);
        
        // Merge orders, prioritize localStorage for duplicates
        const allOrders = [...jsonOrders, ...localOrders];
        orders = Array.from(new Map(allOrders.map(o => [o.orderNumber, o])).values())
            .filter(order => validStatuses.includes(order.status));
        
        // Sort by date (newest first)
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
        console.error('Error loading orders:', e);
        let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        localOrders = localOrders
            .map(order => ({
                ...order,
                status: normalizeStatus(order.status)
            }))
            .filter(order => order.status !== null);
        orders = localOrders.filter(order => validStatuses.includes(order.status));
    }

    if (orders.length === 0) {
        shippingList.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-box-open"></i>
                <p>Нет заказов в доставке</p>
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
    shippingList.innerHTML = orders.map(order => `
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
                        ${order.trackingNumber ? `
                            <p><strong>Номер отслеживания:</strong> ${order.trackingNumber}</p>
                        ` : ''}
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
                
                ${order.sellerNotes ? `
                    <div class="order-notes">
                        <h3>Примечания продавца</h3>
                        <p>${order.sellerNotes}</p>
                    </div>
                ` : ''}
                
                <div class="order-actions">
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
    shippingList.addEventListener('click', function(e) {
        const orderId = e.target.dataset.order;
        if (!orderId) return;
        
        if (e.target.classList.contains('delete-order-btn')) {
            deleteOrder(orderId);
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
            'Отправлено': 'shipped',
            'Доставлено': 'delivered'
        };
        return statusClasses[status] || '';
    }

    function getPaymentMethodName(method) {
        return method === 'card' ? 'Картой онлайн' : 'Наложенный платеж (при получении)';
    }

    function deleteOrder(orderId) {
        if (confirm('Вы уверены, что хотите удалить этот заказ из истории?')) {
            try {
                let orders = JSON.parse(localStorage.getItem('orders') || '[]');
                const updatedOrders = orders.filter(order => order.orderNumber !== orderId);
                localStorage.setItem('orders', JSON.stringify(updatedOrders));
                window.location.reload();
            } catch (e) {
                console.error('Error deleting order:', e);
                alert('Ошибка при удалении заказа');
            }
        }
    }
});