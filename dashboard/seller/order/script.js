document.addEventListener('DOMContentLoaded', async function() {
    const orderList = document.getElementById('orderList');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    // Load orders from orders.json and localStorage
    let orders = [];
    try {
        const response = await fetch('../../buyer/data/orders.json');
        if (!response.ok) throw new Error('Failed to load orders.json');
        const jsonOrders = await response.json();
        
        const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        const allOrders = [...jsonOrders, ...localOrders];
        orders = Array.from(new Map(allOrders.map(o => [o.orderNumber, o])).values());
    } catch (e) {
        console.error('Error loading orders:', e);
        orders = JSON.parse(localStorage.getItem('orders') || '[]');
    }

    // Display orders
    if (orders.length === 0) {
        orderList.innerHTML = '<p>Нет заказов.</p>';
        return;
    }

    orderList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-meta">
                    <span class="order-number">Заказ #${order.orderNumber}</span>
                    <span class="order-date">${new Date(order.date).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="order-status ${order.status === 'Отменен' ? 'cancelled' : order.status === 'Доставлено' ? 'delivered' : ''}">
                    ${order.status}
                </div>
            </div>
            <div class="order-details">
                <h3>Детали заказа</h3>
                <p><strong>Покупатель:</strong> ${order.customer.fullName}</p>
                <p><strong>Email:</strong> ${order.customer.email}</p>
                <p><strong>Телефон:</strong> ${order.customer.phone}</p>
                <p><strong>Город:</strong> ${order.customer.city}</p>
                <p><strong>Адрес:</strong> ${order.customer.address}</p>
                <p><strong>Дата доставки:</strong> ${new Date(order.date).toLocaleDateString('ru-RU')}</p>
                <p><strong>Сумма:</strong> ${order.paymentAmount.toLocaleString('ru-RU')} ₽</p>
                <h4>Товары:</h4>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.name} (x${item.quantity}) - ${(item.price * item.quantity).toLocaleString('ru-RU')} ₽</li>
                    `).join('')}
                </ul>
            </div>
            <div class="order-actions">
                <button class="btn process-order-btn" data-order-id="${order.orderNumber}" 
                    ${order.status === 'Доставлено' || order.status === 'Отменен' ? 'disabled' : ''}>
                    Отправить
                </button>
            </div>
        </div>
    `).join('');

    // Process order
    orderList.addEventListener('click', (e) => {
        if (e.target.classList.contains('process-order-btn')) {
            const orderId = e.target.dataset.orderId;
            if (confirm('Подтвердить отправку заказа?')) {
                try {
                    let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                    localOrders = localOrders.map(order => 
                        order.orderNumber === orderId ? { ...order, status: 'Доставлено' } : order
                    );
                    localStorage.setItem('orders', JSON.stringify(localOrders));
                    window.location.reload();
                } catch (e) {
                    console.error('Error processing order:', e);
                    alert('Ошибка при обработке заказа');
                }
            }
        }
    });

    // Export to Excel
    exportExcelBtn.addEventListener('click', () => {
        const data = orders.map(order => ({
            'Номер заказа': order.orderNumber,
            'Дата': new Date(order.date).toLocaleDateString('ru-RU'),
            'Статус': order.status,
            'Покупатель': order.customer.fullName,
            'Email': order.customer.email,
            'Телефон': order.customer.phone,
            'Город': order.customer.city,
            'Адрес': order.customer.address,
            'Сумма': order.paymentAmount,
            'Товары': order.items.map(item => `${item.name} (x${item.quantity})`).join('; ')
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Заказы');
        XLSX.writeFile(wb, 'orders_report.xlsx');
    });

    // Logout
    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../../auth/index.html';
    });
});