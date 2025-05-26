document.addEventListener('DOMContentLoaded', function() {
    const settingsForm = document.getElementById('settingsForm');
    const userData = JSON.parse(localStorage.getItem('userData') || {});

    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    // Load existing settings
    const settings = JSON.parse(localStorage.getItem('platformSettings') || '{}');
    document.getElementById('minShippingCost').value = settings.minShippingCost || 1000;
    document.getElementById('weightCoefficient').value = settings.weightCoefficient || 100;
    document.getElementById('distanceCoefficient').value = settings.distanceCoefficient || 0.15;

    settingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const newSettings = {
            minShippingCost: parseFloat(document.getElementById('minShippingCost').value),
            weightCoefficient: parseFloat(document.getElementById('weightCoefficient').value),
            distanceCoefficient: parseFloat(document.getElementById('distanceCoefficient').value)
        };
        localStorage.setItem('platformSettings', JSON.stringify(newSettings));
        alert('Настройки сохранены');
    });

    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../../auth/index.html';
    });
});