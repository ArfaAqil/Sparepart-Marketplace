document.addEventListener('DOMContentLoaded', async function() {
    const orderList = document.getElementById('orderList');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchFilter = document.getElementById('searchFilter');
    const userData = JSON.parse(localStorage.getItem('userData') || {});

    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    let orders = [];
    async function loadOrders() {
        try {
            const response = await fetch('../../buyer/data/orders.json');
            if (!response.ok) throw new Error('Failed to load orders.json');
            let jsonOrders = await response.json();
            let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            const allOrders = [...jsonOrders, ...localOrders];
            orders = Array.from(new Map(allOrders.map(o => [o.orderNumber, o])).values());
            renderOrders(orders);
        } catch (e) {
            console.error('Error loading orders:', e);
            orders = JSON.parse(localStorage.getItem('orders') || '[]');
            renderOrders(orders);
        }
    }

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
            orderList.innerHTML = '<p>Нет заказов по выбранным критериям</p>';
            return;
        }

        orderList.innerHTML = filteredOrders.map(order => `
            <div class="order-card">
                <div class="order-header" onclick="toggleOrderDetails(this)">
                    <div class="order-meta">
                        <span class="order-number">Заказ #${order.orderNumber}</span>
                        <span class="order-date">${formatDate(order.date)}</span>
                        <span class="order-status">${order.status}</span>
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
                            <p><strong>Имя:</strong> ${order.customer.fullName}</p>
                            <p><strong>Телефон:</strong> ${order.customer.phone}</p>
                            <p><strong>Email:</strong> ${order.customer.email}</p>
                            <p><strong>Адрес:</strong> ${order.customer.city}, ${order.customer.address}</p>
                        </div>
                        <div class="order-info-section">
                            <h3>Детали оплаты</h3>
                            <p><strong>Способ:</strong> ${order.paymentMethod === 'card' ? 'Картой' : 'Наложенный платеж'}</p>
                            <p><strong>Сумма:</strong> ${order.paymentAmount.toLocaleString('ru-RU')} ₽</p>
                        </div>
                    </div>
                    <div class="order-items">
                        <h3>Товары:</h3>
                        ${order.items.map(item => `
                            <div class="order-item">
                                <div class="item-image">
                                    <img src="${item.images[0].replace('../../', '../../../')}" alt="${item.name}" 
                                         onerror="this.onerror=null;this.src='https://via.placeholder.com/40x40?text=No+Image'">
                                </div>
                                <div class="item-info">
                                    <h4>${item.name}</h4>
                                    <div class="item-icon">
                                        <img src="${item.images[0].replace('../../', '../../../')}" alt="${item.name} Icon" 
                                             onerror="this.onerror=null;this.src='https://via.placeholder.com/40x40?text=No+Image'">
                                    </div>
                                    <p>${item.quantity} × ${item.price.toLocaleString('ru-RU')} ₽</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-actions">
                        <select class="status-select" data-order="${order.orderNumber}">
                            <option value="Ожидает оплаты" ${order.status === 'Ожидает оплаты' ? 'selected' : ''}>Ожидает оплаты</option>
                            <option value="Оплачено" ${order.status === 'Оплачено' ? 'selected' : ''}>Оплачено</option>
                            <option value="Оплата при получении" ${order.status === 'Оплата при получении' ? 'selected' : ''}>Оплата при получении</option>
                            <option value="В обработке" ${order.status === 'В обработке' ? 'selected' : ''}>В обработке</option>
                            <option value="Отправлено" ${order.status === 'Отправлено' ? 'selected' : ''}>Отправлено</option>
                            <option value="Доставлено" ${order.status === 'Доставлено' ? 'selected' : ''}>Доставлено</option>
                            <option value="Отменен" ${order.status === 'Отменен' ? 'selected' : ''}>Отменен</option>
                        </select>
                        <button class="btn delete-btn" data-order="${order.orderNumber}">Удалить</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    window.toggleOrderDetails = function(element) {
        const details = element.nextElementSibling;
        details.classList.toggle('show');
        element.querySelector('.fa-chevron-down').classList.toggle('rotate');
    };

    function formatDate(dateString) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    }

    orderList.addEventListener('change', function(e) {
        if (e.target.classList.contains('status-select')) {
            const orderNumber = e.target.dataset.order;
            const newStatus = e.target.value;
            if (confirm(`Изменить статус заказа #${orderNumber} на "${newStatus}"?`)) {
                let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                localOrders = localOrders.map(o => o.orderNumber === orderNumber ? { ...o, status: newStatus } : o);
                localStorage.setItem('orders', JSON.stringify(localOrders));
                loadOrders();
            }
        }
    });

    orderList.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            const orderNumber = e.target.dataset.order;
            if (confirm(`Удалить заказ #${orderNumber}?`)) {
                let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                localOrders = localOrders.filter(o => o.orderNumber !== orderNumber);
                localStorage.setItem('orders', JSON.stringify(localOrders));
                loadOrders();
            }
        }
    });

    statusFilter.addEventListener('change', () => renderOrders(orders));
    dateFilter.addEventListener('change', () => renderOrders(orders));
    searchFilter.addEventListener('input', () => renderOrders(orders));

    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../../auth/index.html';
    });

    loadOrders();
});