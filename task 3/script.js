(function() {
    const screenWidthSpan = document.getElementById('screenWidthValue');
    const screenHeightSpan = document.getElementById('screenHeightValue');
    const locationSpan = document.getElementById('locationValue');
    const getInfoBtn = document.getElementById('getInfoBtn');

    // Функция получения актуальных размеров экрана
    function getScreenSize() {
        return {
            width: window.screen.width,
            height: window.screen.height
        };
    }

    // Обновить отображение размеров экрана
    function updateScreenDisplay() {
        const size = getScreenSize();
        screenWidthSpan.textContent = `${size.width} px`;
        screenHeightSpan.textContent = `${size.height} px`;
    }

    // Функция получения местоположения 
    function getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Информация о местоположении недоступна'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    resolve({ lat: latitude, lng: longitude });
                },
                (error) => {
                    console.warn('[Geo] Ошибка получения координат:', error.code, error.message);
                    reject(new Error('Информация о местоположении недоступна'));
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    // Обновить геолокацию в панели
    async function updateLocationDisplay() {
        locationSpan.innerHTML = '<span style="opacity:0.7">⏳ Запрос координат...</span>';
        
        try {
            const coords = await getCurrentPosition();
            const latFormatted = coords.lat.toFixed(6);
            const lngFormatted = coords.lng.toFixed(6);
            locationSpan.innerHTML = `🌐 ${latFormatted}° N / ${lngFormatted}° E<br><span style="font-size:0.8rem; opacity:0.7;">(широта, долгота)</span>`;
            locationSpan.style.background = '#ffffffb3';
            locationSpan.style.padding = '0.2rem 0.8rem';
        } catch (err) {
            locationSpan.innerHTML = '❌ Информация о местоположении недоступна';
            locationSpan.style.background = '#fff0e6';
            locationSpan.style.padding = '0.2rem 0.8rem';
            locationSpan.style.borderRadius = '28px';
        }
    }

    async function onClickHandler() {
        updateScreenDisplay();
        await updateLocationDisplay();
        const panel = document.getElementById('infoPanel');
        panel.style.transition = 'background 0.2s';
        panel.style.background = '#e9f0fe';
        setTimeout(() => {
            panel.style.background = '#f0f4fa';
        }, 200);
    }

    // Инициализация пустых значений
    function initializePlaceholders() {
        screenWidthSpan.textContent = '—';
        screenHeightSpan.textContent = '—';
        locationSpan.textContent = '—';
    }

    getInfoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        onClickHandler().catch(err => {
            console.error('Непредвиденная ошибка:', err);
            if (locationSpan) {
                locationSpan.innerHTML = '⚠️ Информация о местоположении недоступна';
            }
        });
    });

    // Инициализация
    initializePlaceholders();
})();