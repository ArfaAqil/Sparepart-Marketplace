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
            jsonProducts = jsonProducts.map(p => ({ ...p, id: String(p.id), status: p.status || 'approved' }));
            let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
            localProducts = localProducts.map(p => ({ ...p, id: String(p.id), status: p.status || 'pending' }));
            products = Array.from(new Map([...jsonProducts, ...localProducts].map(p => [p.id, p])).values());

            // Load orders
            const orderResponse = await fetch('../../buyer/data/orders.json');
            if (!orderResponse.ok) throw new Error('Failed to load orders.json');
            let jsonOrders = await orderResponse.json();
            let localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders = Array.from(new Map([...jsonOrders, ...localOrders].map(o => [o.orderNumber, o])).values());

            renderAnalytics();
        } catch (e) {
            console.error('Error loading data:', e);
            users = JSON.parse(localStorage.getItem('users') || '[]');
            products = JSON.parse(localStorage.getItem('products') || '[]');
            orders = JSON.parse(localStorage.getItem('orders') || '[]');
            renderAnalytics();
        }
    }

    function renderAnalytics() {
        // Orders by category chart
        const categories = ['Тормоза', 'Подвеска', 'Двигатель', 'Фильтры', 'Смазки'];
        const orderCounts = categories.map(cat => 
            orders.filter(o => o.items.some(i => i.category === cat)).length
        );

        new Chart(document.getElementById('ordersByCategoryChart'), {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Количество заказов',
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
        const activityData = users.map(user => {
            const userOrders = orders.filter(o => o.customer.email === user.email);
            const userProducts = products.filter(p => p.seller === user.email);
            return {
                fullName: user.username,
                orders: userOrders.length,
                products: userProducts.length
            };
        }).slice(0, 5); // Top 5 users

        userActivity.innerHTML = activityData.map(data => `
            <p><strong>${data.fullName}</strong>: ${data.orders} заказов, ${data.products} товаров</p>
        `).join('');

        // Popular products
        const popularProducts = document.getElementById('popularProducts');
        const productCounts = products.map(p => ({
            name: p.name,
            count: orders.reduce((sum, o) => sum + o.items.filter(i => i.id === p.id).length, 0)
        })).sort((a, b) => b.count - a.count).slice(0, 5);

        popularProducts.innerHTML = productCounts.map(p => `
            <p><strong>${p.name}</strong>: ${p.count} заказов</p>
        `).join('');
    }

    exportUsersProductsBtn.addEventListener('click', () => {
        const userData = users.map(u => ({
            'Имя': u.username,
            'Email': u.email,
            'Роль': u.role,
            'Статус': u.blocked ? 'Заблокирован' : 'Активен',
            'Дата регистрации': formatDate(u.registrationDate || u.date)
        }));

        const productData = products.map(p => ({
            'Название': p.name,
            'Цена': p.price,
            'Категория': p.category,
            'Статус': p.status,
            'Продавец': p.seller || 'Не указан'
        }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(userData), 'Пользователи');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productData), 'Товары');
        XLSX.writeFile(wb, `users_and_products_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`);
    });

    exportReportBtn.addEventListener('click', () => {
        const categories = ['Тормоза', 'Подвеска', 'Двигатель', 'Фильтры', 'Смазки'];
        const orderCounts = categories.map(cat => 
            orders.filter(o => o.items.some(i => i.category === cat)).length
        );

        const activityData = users.map(user => {
            const userOrders = orders.filter(o => o.customer.email === user.email);
            const userProducts = products.filter(p => p.seller === user.email);
            return {
                fullName: user.username,
                orders: userOrders.length,
                products: userProducts.length
            };
        }).slice(0, 5);

        const productCounts = products.map(p => ({
            name: p.name,
            count: orders.reduce((sum, o) => sum + o.items.filter(i => i.id === p.id).length, 0)
        })).sort((a, b) => b.count - a.count).slice(0, 5);

        const reportData = [
            {
                'Тип': 'Заказы по категориям',
                'Данные': categories.map((cat, i) => `${cat}: ${orderCounts[i]}`).join('; ')
            },
            {
                'Тип': 'Активность пользователей',
                'Данные': activityData.map(d => `${d.fullName}: ${d.orders} заказов, ${d.products} товаров`).join('; ')
            },
            {
                'Тип': 'Популярные товары',
                'Данные': productCounts.map(p => `${p.name}: ${p.count} заказов`).join('; ')
            }
        ];

        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Отчет');
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