document.addEventListener('DOMContentLoaded', async function() {
    const orderList = document.getElementById('orderList');
    const cartCounter = document.getElementById('cartCounter');

    // Safe cart counter update
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        cartCounter.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    } catch (e) {
        console.error('Error loading cart:', e);
        cartCounter.textContent = '0';
    }

    // Load orders from orders.json and localStorage
    let orders = [];
    try {
        // Load from orders.json
        const response = await fetch('../data/orders.json');
        if (!response.ok) throw new Error('Failed to load orders.json');
        const jsonOrders = await response.json();
        
        // Load from localStorage
        const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        // Combine orders, ensuring no duplicates by orderNumber
        const allOrders = [...jsonOrders, ...localOrders];
        orders = Array.from(new Map(allOrders.map(o => [o.orderNumber, o])).values());
    } catch (e) {
        console.error('Error loading orders:', e);
        // Fallback to localStorage only
        orders = JSON.parse(localStorage.getItem('orders') || '[]');
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

    orderList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-meta">
                    <span class="order-number">Заказ #${order.orderNumber}</span>
                    <span class="order-date">${new Date(order.date).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="order-status ${order.status === 'Отменен' ? 'cancelled' : ''}">
                    ${order.status}
                </div>
            </div>
            <div class="order-summary">
                <div class="order-total">${order.paymentAmount.toLocaleString('ru-RU')} ₽</div>
            </div>
            <div class="order-actions">
                <button class="cancel-order-btn" data-order="${order.orderNumber}" ${order.status === 'Отменен' ? 'disabled' : ''}>
                    Отменить
                </button>
                <button class="delete-order-btn" data-order="${order.orderNumber}">
                    Удалить
                </button>
                <a href="../index.html" class="back-to-catalog-btn">
                    Каталог
                </a>
            </div>
        </div>
    `).join('');

    // Event delegation with error handling
    orderList.addEventListener('click', function(e) {
        try {
            const orderId = e.target.dataset.order;
            if (!orderId) return;
            
            if (e.target.classList.contains('cancel-order-btn')) {
                cancelOrder(orderId);
            } else if (e.target.classList.contains('delete-order-btn')) {
                deleteOrder(orderId);
            }
        } catch (error) {
            console.error('Error handling order action:', error);
        }
    });

    function cancelOrder(orderId) {
        if (confirm('Вы уверены, что хотите отменить этот заказ?')) {
            try {
                let orders = JSON.parse(localStorage.getItem('orders') || '[]');
                const updatedOrders = orders.map(order => 
                    order.orderNumber === orderId ? { ...order, status: 'Отменен' } : order
                );
                localStorage.setItem('orders', JSON.stringify(updatedOrders));
                window.location.reload();
            } catch (e) {
                console.error('Error canceling order:', e);
                alert('Ошибка при отмене заказа');
            }
        }
    }

    function deleteOrder(orderId) {
        if (confirm('Вы уверены, что хотите удалить этот заказ?')) {
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