document.addEventListener('DOMContentLoaded', async function() {
    const exportUsersProductsBtn = document.getElementById('exportUsersProductsBtn');
    const exportReportBtn = document.getElementById('exportReportBtn');
    const userData = JSON.parse(localStorage.getItem('userData') || {});

    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    let users = [];
    let products = [];
    let orders = [];

    async function loadData() {
        try {
            // Load users
            const userResponse = await fetch('../../../auth/data/users.json');
            if (!userResponse.ok) throw new Error('Failed to load users.json');
            let jsonUsers = await userResponse.json();
            let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
            users = Array.from(new Map([...jsonUsers, ...localUsers].map(u => [u.email, u])).values());

            // Load products
            const productResponse = await fetch('../../buyer/data/products.json');
            if (!productResponse.ok) throw new Error('Failed to load products.json');
            let jsonProducts = await productResponse.json();
            jsonProducts = jsonProducts.map(p => ({ ...p, id: String(p.id), status: p.status || 'approved', name: p.name.trim() }));
            let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
            localProducts = localProducts.map(p => ({ ...p, id: String(p.id), status: p.status || 'pending', name: p.name.trim() }));
            products = Array.from(new Map([...jsonProducts, ...localProducts].map(p => [p.id, p])).values());

            // Load orders
            const orderResponse = await fetch('../../buyer/data/orders.json');
            if (!orderResponse.ok) throw new Error('Failed to load orders.json');
            let jsonOrders = await orderResponse.json();
            let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders = Array.from(new Map([...jsonOrders, ...localOrders].map(o => [o.orderNumber, o])).values())
                .filter(o => o.status !== 'Отменен');
        } catch (e) {
            console.error('Error loading data:', e);
            users = JSON.parse(localStorage.getItem('users') || '[]');
            products = JSON.parse(localStorage.getItem('products') || '[]').map(p => ({ ...p, name: p.name.trim() }));
            orders = JSON.parse(localStorage.getItem('orders') || '[]').filter(o => o.status !== 'Отменен');
        }

        renderAnalytics();
    }

    function getProductCategory(orderItem) {
        const normalizedOrderItemName = orderItem.name.trim();
        const matchedProduct = products.find(p => p.name.trim() === normalizedOrderItemName);
        return matchedProduct ? matchedProduct.category : 'Неизвестно';
    }

    function renderAnalytics() {
        // Orders by category chart
        const categories = ['Тормоза', 'Подвеска', 'Двигатель', 'Фильтры', 'Смазки'];
        const orderCounts = categories.map(cat => 
            orders.reduce((count, order) => 
                count + order.items.filter(item => getProductCategory(item) === cat).length, 0)
        );

        new Chart(document.getElementById('ordersByCategoryChart'), {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Количество позиций в заказах',
                    data: orderCounts,
                    backgroundColor: ['#6a1b9a', '#ab47bc', '#ff4081', '#4a148c', '#ce93d8'],
                    borderColor: ['#4a148c', '#8e24aa', '#c2185b', '#311b92', '#b39ddb'],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // User activity
        const userActivity = document.getElementById('userActivity');
        const buyerUsers = users.filter(u => u.role === 'buyer');
        const sellerUsers = users.filter(u => u.role === 'seller');
        const totalBuyerOrders = orders.length;
        const totalSellerProducts = products.filter(p => p.status === 'approved').length;

        userActivity.innerHTML = `
            <p><strong>Покупатели:</strong> ${totalBuyerOrders} заказов (всего ${buyerUsers.length} покупателей)</p>
            <p><strong>Продавцы:</strong> ${totalSellerProducts} товаров (всего ${sellerUsers.length} продавцов)</p>
        `;

        // Popular products
        const popularProducts = document.getElementById('popularProducts');
        const productCounts = products.map(p => ({
            name: p.name,
            category: p.category,
            count: orders.reduce((sum, o) => 
                sum + o.items.filter(i => i.name.trim() === p.name.trim()).reduce((qty, i) => qty + i.quantity, 0), 0),
            revenue: orders.reduce((sum, o) => 
                sum + o.items.filter(i => i.name.trim() === p.name.trim()).reduce((total, i) => total + (i.price * i.quantity), 0), 0)
        })).sort((a, b) => b.count - a.count).slice(0, 5);

        popularProducts.innerHTML = productCounts.map(p => `
            <p><strong>${p.name}</strong> (${p.category}): ${p.count} заказов, ${p.revenue.toLocaleString('ru-RU')} ₽</p>
        `).join('');
    }

    exportUsersProductsBtn.addEventListener('click', () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Users section
        wsData.push(['Пользователи']);
        wsData.push(['Имя', 'Email', 'Роль', 'Статус']);
        users.forEach(u => {
            wsData.push([
                u.username,
                u.email,
                u.role,
                u.blocked ? 'Заблокирован' : 'Активен'
            ]);
        });

        // Add empty row
        wsData.push([]);

        // Products section
        wsData.push(['Товары']);
        wsData.push(['Название', 'Цена', 'Категория', 'Статус']);
        products.forEach(p => {
            wsData.push([
                p.name,
                p.price,
                p.category,
                p.status
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Пользователи и товары');
        XLSX.writeFile(wb, `users_and_products_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`);
    });

    exportReportBtn.addEventListener('click', () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];
        const categories = ['Тормоза', 'Подвеска', 'Двигатель', 'Фильтры', 'Смазки'];

        // Orders by category section
        wsData.push(['Заказы по категориям']);
        wsData.push(['Категория', 'Количество позиций', 'Общая сумма (₽)']);
        categories.forEach(cat => {
            const count = orders.reduce((sum, order) => 
                sum + order.items.filter(item => getProductCategory(item) === cat).reduce((qty, i) => qty + i.quantity, 0), 0);
            const revenue = orders.reduce((sum, order) => 
                sum + order.items.filter(item => getProductCategory(item) === cat).reduce((total, i) => total + (i.price * i.quantity), 0), 0);
            
            wsData.push([
                cat,
                count,
                revenue
            ]);
        });

        // Add empty row
        wsData.push([]);

        // Popular products section
        wsData.push(['Популярные товары']);
        wsData.push(['Название', 'Категория', 'Количество заказов', 'Общая сумма (₽)']);
        const productCounts = products.map(p => ({
            name: p.name,
            category: p.category,
            count: orders.reduce((sum, o) => 
                sum + o.items.filter(i => i.name.trim() === p.name.trim()).reduce((qty, i) => qty + i.quantity, 0), 0),
            revenue: orders.reduce((sum, o) => 
                sum + o.items.filter(i => i.name.trim() === p.name.trim()).reduce((total, i) => total + (i.price * i.quantity), 0), 0)
        })).sort((a, b) => b.count - a.count).slice(0, 10);
        
        productCounts.forEach(p => {
            wsData.push([
                p.name,
                p.category,
                p.count,
                p.revenue
            ]);
        });

        // Add empty row
        wsData.push([]);

        // User activity section
        wsData.push(['Активность пользователей']);
        wsData.push(['Роль', 'Email', 'Активность']);
        const buyerUsers = users.filter(u => u.role === 'buyer');
        const sellerUsers = users.filter(u => u.role === 'seller');
        const totalBuyerOrders = orders.length;
        const totalSellerProducts = products.filter(p => p.status === 'approved').length;

        buyerUsers.forEach(u => {
            wsData.push([
                'Покупатели',
                u.email,
                `${totalBuyerOrders} заказов`
            ]);
        });

        sellerUsers.forEach(u => {
            wsData.push([
                'Продавцы',
                u.email,
                `${totalSellerProducts} товаров`
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Админ отчет');
        XLSX.writeFile(wb, `admin_report_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`);
    });

    function formatDate(dateString) {
        if (!dateString) return 'Не указана';
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    }

    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../../auth/index.html';
    });

    loadData();
});