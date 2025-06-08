document.addEventListener('DOMContentLoaded', async function() {
    const shippingList = document.getElementById('shippingList');
    const refreshShippingBtn = document.getElementById('refreshShippingBtn');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchFilter = document.getElementById('searchFilter');
    const userData = JSON.parse(localStorage.getItem('userData') || {});
    
    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    // Valid status values for shipping
    const validStatuses = ['Отправлено', 'Доставлено'];

    // Normalize status
    function normalizeStatus(status) {
        if (!status || typeof status !== 'string') {
            console.warn('Invalid or missing status, skipping order:', status);
            return null; // Return null for invalid status to exclude from rendering
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
        console.log(`Normalized status: "${status}" -> "${result}"`);
        return result;
    }

    // Load orders
    let orders = [];
    async function loadOrders() {
        try {
            const response = await fetch('http://localhost:8000/seller/orders?sellerId=' + encodeURIComponent(userData.id));
            const orders = await response.json();
            
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
            
            console.log('Shipping orders loaded:', orders);
            renderOrders(orders);
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
            console.log('Fallback to local orders:', orders);
            renderOrders(orders);
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

    // Render orders with filtering
    function renderOrders(ordersToRender) {
        const status = statusFilter.value;
        const date = dateFilter.value;
        const search = searchFilter.value.toLowerCase();
        
        const filteredOrders = ordersToRender.filter(order => {
            const matchesStatus = status === 'all' || order.status === status;
            const matchesDate = !date || new Date(order.date).toISOString().split('T')[0] === date;
            const matchesSearch = !search || 
                order.orderNumber.toLowerCase().includes(search) ||
                order.customer.fullName.toLowerCase().includes(search);
            
            return matchesStatus && matchesDate && matchesSearch;
        });

        if (filteredOrders.length === 0) {
            shippingList.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-box-open"></i>
                    <p>Нет заказов в доставке</p>
                </div>
            `;
            return;
        }

        shippingList.innerHTML = filteredOrders.map(order => {
            console.log(`Rendering shipping order #${order.orderNumber}, status: ${order.status}`);
            return `
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
                            <span>${order.customer.fullName}</span>
                            <span class="order-total">${order.paymentAmount.toLocaleString('ru-RU')} ₽</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    </div>
                    
                    <div class="order-details">
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
                        
                        <div class="order-actions">
                            ${order.status === 'Отправлено' ? `
                                <a href="../process-order/index.html?orderNumber=${order.orderNumber}" class="btn complete-order-btn">
                                    Подтвердить доставку
                                </a>
                            ` : ''}
                            
                            <button class="btn delete-order-btn" data-order="${order.orderNumber}">
                                Удалить заказ
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

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
        return statusClasses[status] || 'unknown';
    }

    function getPaymentMethodName(method) {
        return method === 'card' ? 'Картой онлайн' : 'Наложенный платеж (при получении)';
    }

    // Event listeners
    shippingList.addEventListener('click', function(e) {
        const orderId = e.target.dataset.order;
        if (!orderId) return;
        
        if (e.target.classList.contains('delete-order-btn')) {
            if (confirm('Удалить запись о заказе из системы?')) {
                try {
                    let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                    const updatedOrders = localOrders.filter(order => order.orderNumber !== orderId);
                    localStorage.setItem('orders', JSON.stringify(updatedOrders));
                    loadOrders();
                } catch (e) {
                    console.error('Error deleting order:', e);
                    alert('Ошибка при удалении заказа');
                }
            }
        }
    });

    refreshShippingBtn.addEventListener('click', () => {
        location.reload();
    });

    statusFilter.addEventListener('change', () => renderOrders(orders));
    dateFilter.addEventListener('change', () => renderOrders(orders));
    searchFilter.addEventListener('input', () => renderOrders(orders));

    // Logout
    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../../auth/index.html';
    });

    // Initial load
    loadOrders();
});