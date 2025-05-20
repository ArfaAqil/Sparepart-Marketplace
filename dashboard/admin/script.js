document.addEventListener('DOMContentLoaded', function() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    // Logout
    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../auth/index.html';
    });
});