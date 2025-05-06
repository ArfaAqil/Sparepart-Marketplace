document.addEventListener('DOMContentLoaded', async function() {
    const orderList = document.getElementById('orderList');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const refreshOrdersBtn = document.getElementById('refreshOrdersBtn');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchFilter = document.getElementById('searchFilter');
    const userData = JSON.parse(localStorage.getItem('userData') || {});
    
    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    // Valid status values for order page (exclude Отправлено and Доставлено)
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

    // Load orders
    let orders = [];
    async function loadOrders() {
        try {
            const response = await fetch('../../buyer/data/orders.json');
            if (!response.ok) throw new Error('Failed to load orders.json');
            let jsonOrders = await response.json();
            
            // Normalize statuses
            jsonOrders = jsonOrders.map(order => ({
                ...order,
                status: normalizeStatus(order.status)
            }));
            
            let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            localOrders = localOrders.map(order => ({
                ...order,
                status: normalizeStatus(order.status)
            }));
            
            const allOrders = [...jsonOrders, ...localOrders];
            orders = Array.from(new Map(allOrders.map(o => [o.orderNumber, o])).values());
            console.log('Orders loaded:', orders);
            renderOrders(orders);
        } catch (e) {
            console.error('Error loading orders:', e);
            let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            localOrders = localOrders.map(order => ({
                ...order,
                status: normalizeStatus(order.status)
            }));
            orders = localOrders;
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

    // Render orders with filtering (exclude Отправлено and Доставлено)
    function renderOrders(ordersToRender) {
        const status = statusFilter.value;
        const date = dateFilter.value;
        const search = searchFilter.value.toLowerCase();
        
        const filteredOrders = ordersToRender.filter(order => {
            // Only include orders with valid statuses for this page
            if (!validStatuses.includes(order.status)) return false;
            const matchesStatus = status === 'all' || order.status === status;
            const matchesDate = !date || new Date(order.date).toISOString().split('T')[0] === date;
            const matchesSearch = !search || 
                order.orderNumber.toLowerCase().includes(search) ||
                order.customer.fullName.toLowerCase().includes(search);
            
            return matchesStatus && matchesDate && matchesSearch;
        });

        if (filteredOrders.length === 0) {
            orderList.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-box-open"></i>
                    <p>Нет заказов по выбранным критериям</p>
                </div>
            `;
            return;
        }

        orderList.innerHTML = filteredOrders.map(order => {
            console.log(`Rendering order #${order.orderNumber}, status: ${order.status}`);
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
                        
                        <div class="order-actions">
                            ${order.status === 'Ожидает оплаты' ? `
                                <button class="btn cancel-order-btn" data-order="${order.orderNumber}">
                                    Отменить заказ
                                </button>
                            ` : ''}
                            
                            ${['Оплачено', 'Оплата при получении'].includes(order.status) ? `
                                <a href="../process-order/index.html?orderNumber=${order.orderNumber}" class="btn process-order-btn">
                                    Начать обработку
                                </a>
                            ` : ''}
                            
                            ${order.status === 'В обработке' ? `
                                <a href="../process-order/index.html?orderNumber=${order.orderNumber}" class="btn ship-order-btn">
                                    Отправить заказ
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
            'Ожидает оплаты': 'pending',
            'Оплачено': 'paid',
            'В обработке': 'processing',
            'Отменен': 'cancelled',
            'Оплата при получении': 'cod'
        };
        return statusClasses[status] || 'unknown';
    }

    function getPaymentMethodName(method) {
        return method === 'card' ? 'Картой онлайн' : 'Наложенный платеж (при получении)';
    }

    function updateOrderStatus(orderNumber, newStatus) {
        try {
            let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            const updatedOrders = localOrders.map(order => 
                order.orderNumber === orderNumber ? { ...order, status: newStatus } : order
            );
            localStorage.setItem('orders', JSON.stringify(updatedOrders));
            loadOrders();
        } catch (e) {
            console.error('Error updating order status:', e);
            alert('Ошибка при обновлении статуса заказа');
        }
    }

    // Event listeners
    orderList.addEventListener('click', function(e) {
        const orderId = e.target.dataset.order;
        if (!orderId) return;
        
        if (e.target.classList.contains('cancel-order-btn')) {
            if (confirm('Вы уверены, что хотите отменить этот заказ?')) {
                updateOrderStatus(orderId, 'Отменен');
            }
        } else if (e.target.classList.contains('delete-order-btn')) {
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

    exportExcelBtn.addEventListener('click', () => {
        // Include ALL orders in Excel export, even those in shipping
        const data = orders.map(order => ({
            'Номер заказа': order.orderNumber,
            'Дата': formatDate(order.date),
            'Статус': order.status,
            'Клиент': order.customer.fullName,
            'Телефон': order.customer.phone,
            'Город': order.customer.city,
            'Адрес': order.customer.address,
            'Сумма': order.paymentAmount,
            'Товары': order.items.map(item => `${item.name} (${item.quantity} × ${item.price} ₽)`).join('; '),
            'Способ оплаты': getPaymentMethodName(order.paymentMethod),
            'Номер отслеживания': order.trackingNumber || '',
            'Примечания продавца': order.sellerNotes || ''
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Заказы');
        XLSX.writeFile(wb, `orders_${new Date().toISOString().split('T')[0]}.xlsx`);
    });

    refreshOrdersBtn.addEventListener('click', () => {
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