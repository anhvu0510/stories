// Float Menu Animation Effects
document.addEventListener('DOMContentLoaded', function() {
    console.log('Float menu script loaded!');
    
    // Float Menu Toggle Functionality
    const floatMenuToggle = document.getElementById('float-menu-toggle');
    const floatMenuContainer = document.querySelector('.float-menu-container');
    const menuButtons = document.querySelectorAll('.float-menu-button');
    
    console.log('Float menu elements:', { floatMenuToggle, floatMenuContainer, menuButtons });
    
    // Kiểm tra xem các phần tử có tồn tại hay không
    if (!floatMenuToggle || !floatMenuContainer) {
        console.error('Missing float menu elements!');
        return;
    }
    
    // Thêm trình lắng nghe sự kiện cho nút toggle menu
    floatMenuToggle.addEventListener('click', function(e) {
        console.log('Float menu toggle clicked');
        e.preventDefault();
        floatMenuContainer.classList.toggle('active');
        floatMenuToggle.classList.toggle('active');
    });
    
    // Thêm trình lắng nghe sự kiện cho các nút menu
    menuButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            console.log('Menu button clicked:', button.id);
            createRippleEffect(e);
        });
    });
    
    // Function tạo hiệu ứng ripple khi click
    function createRippleEffect(event) {
        const button = event.currentTarget;
        
        // Xóa các hiệu ứng ripple cũ nếu có
        const ripples = button.getElementsByClassName('ripple-effect');
        while(ripples.length > 0) {
            ripples[0].parentNode.removeChild(ripples[0]);
        }
        
        // Tạo element ripple mới
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        
        // Tính toán vị trí của ripple
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - radius;
        const y = event.clientY - rect.top - radius;
        
        // Thiết lập style cho ripple
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${x}px`;
        circle.style.top = `${y}px`;
        circle.classList.add('ripple-effect');
        
        // Thêm ripple vào button
        button.appendChild(circle);
        
        // Xóa ripple sau khi hiệu ứng hoàn thành
        setTimeout(() => {
            if (circle && circle.parentNode) {
                circle.parentNode.removeChild(circle);
            }
        }, 600);
    }
    
    // Cập nhật handler cho các button
    const toggleChaptersBtn = document.getElementById('toggle-chapters-btn');
    if (toggleChaptersBtn) {
        toggleChaptersBtn.addEventListener('click', function() {
            console.log('Toggle chapters button clicked');
            const chapterMenu = document.getElementById('chapter-menu');
            const menuOverlay = document.getElementById('menu-overlay');
            if (chapterMenu && menuOverlay && typeof toggleUIElement === 'function') {
                // Kiểm tra trạng thái hiện tại của menu để đóng/mở
                const isCurrentlyOpen = chapterMenu.classList.contains('open');
                toggleUIElement(chapterMenu, menuOverlay, !isCurrentlyOpen);
                
                // Highlight active chapter if menu is being opened
                if (!isCurrentlyOpen && typeof hightLightActiveChapter === 'function') {
                    hightLightActiveChapter();
                }
            } else {
                console.error('Missing required elements or functions for toggle chapters');
            }
        });
    }
    
    const openSettingsBtn = document.getElementById('open-settings-btn');
    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', function() {
            console.log('Open settings button clicked');
            const settingsModal = document.getElementById('settings-modal');
            const modalOverlay = document.getElementById('modal-overlay');
            if (settingsModal && modalOverlay && typeof toggleModal === 'function') {
                toggleModal(settingsModal, modalOverlay, true);
            } else {
                console.error('Missing required elements or functions for open settings');
            }
        });
    }
    
    // Xóa bỏ event listener cho upload-file-btn ở đây vì nó đã được xử lý trong inline script
    // Điều này giúp tránh bị kích hoạt hai lần
});

// Thêm style cho ripple effect
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }

    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }`;
    document.head.appendChild(style);
});
