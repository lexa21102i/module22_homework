(function() {
    const API_KEY = '32bcd4a6e4b548968e7afcdb682ac679';
    const API_BASE_URL = 'https://api.ipgeolocation.io/timezone';
    const getTimezoneBtn = document.getElementById('getTimezoneBtn');
    const timezoneValueEl = document.getElementById('timezoneValue');
    const datetimeValueEl = document.getElementById('datetimeValue');

    // Функция получения геолокации пользователя
    function getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation API не поддерживается вашим браузером'));
                return;
            }

            // Запрос геолокации
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    resolve({ lat: latitude, lng: longitude });
                },
                (error) => {
                    let errorMessage = 'Не удалось определить местоположение';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Доступ к геолокации запрещён пользователем';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Информация о местоположении недоступна';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Время ожидания геолокации истекло';
                            break;
                        default:
                            errorMessage = 'Ошибка при получении геолокации';
                    }
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }
            );
        });
    }

    // Функция запроса к Timezone API
    async function fetchTimezone(latitude, longitude) {
        // Формируем URL с параметрами
        const url = `${API_BASE_URL}?apiKey=${API_KEY}&lat=${latitude}&long=${longitude}`;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ошибка: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Проверяем, что в ответе есть необходимые поля
            if (!data || !data.timezone) {
                throw new Error('Некорректный ответ от API');
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка запроса к Timezone API:', error);
            throw new Error('Не удалось получить данные о часовом поясе. Проверьте подключение к интернету.');
        }
    }

    // Установка состояния загрузки
    function setLoadingState() {
        timezoneValueEl.innerHTML = '<div class="loading-value"><span class="spinner"></span> Загрузка...</div>';
        datetimeValueEl.innerHTML = '<div class="loading-value"><span class="spinner"></span> Загрузка...</div>';
        timezoneValueEl.classList.remove('error-value');
        datetimeValueEl.classList.remove('error-value');
    }

    // Установка ошибки
    function setErrorState(message) {
        timezoneValueEl.innerHTML = `❌ ${message}`;
        datetimeValueEl.innerHTML = `❌ ${message}`;
        timezoneValueEl.classList.add('error-value');
        datetimeValueEl.classList.add('error-value');
    }

    // Очистка предыдущих результатов
    function clearResults() {
        timezoneValueEl.innerHTML = '—';
        datetimeValueEl.innerHTML = '—';
        timezoneValueEl.classList.remove('error-value', 'loading-value');
        datetimeValueEl.classList.remove('error-value', 'loading-value');
    }

    // Установка успешного результата
    function setSuccessState(timezone, dateTimeTxt) {
        timezoneValueEl.innerHTML = `🕒 ${escapeHtml(timezone)}`;
        datetimeValueEl.innerHTML = `📆 ${escapeHtml(dateTimeTxt)}`;
        timezoneValueEl.classList.remove('error-value');
        datetimeValueEl.classList.remove('error-value');
    }

    function escapeHtml(str) {
        if (!str) return '—';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Основная функция обработки клика
    async function handleGetTimezone() {
        // Блокируем кнопку на время выполнения запроса
        getTimezoneBtn.disabled = true;
        const originalBtnText = getTimezoneBtn.innerHTML;
        getTimezoneBtn.innerHTML = '⏳ Определение...';
        clearResults();

        try {
            // Шаг 1: Получаем геолокацию
            setLoadingState();
            
            let position;
            try {
                position = await getCurrentPosition();
            } catch (geoError) {
                throw new Error(`${geoError.message}`);
            }

            const { lat, lng } = position;
            console.log(`Координаты получены: широта=${lat}, долгота=${lng}`);

            // Шаг 2: Запрашиваем Timezone API
            // Обновляем сообщение о загрузке
            timezoneValueEl.innerHTML = '<div class="loading-value"><span class="spinner"></span> Запрос к API...</div>';
            datetimeValueEl.innerHTML = '<div class="loading-value"><span class="spinner"></span> Запрос к API...</div>';

            const timezoneData = await fetchTimezone(lat, lng);
            
            // Шаг 3: Извлекаем нужные данные
            const timezone = timezoneData.timezone;
            const dateTimeTxt = timezoneData.date_time_txt;
            
            if (!timezone) {
                throw new Error('В ответе API отсутствует параметр timezone');
            }
            
            if (!dateTimeTxt) {
                console.warn('Параметр date_time_txt отсутствует в ответе API');
            }
            
            setSuccessState(timezone, dateTimeTxt || 'Данные о времени недоступны');
            
            const panel = document.getElementById('infoPanel');
            panel.style.transition = 'background 0.2s';
            panel.style.background = '#ecfdf5';
            setTimeout(() => {
                panel.style.background = '#f9fafb';
            }, 300);
            
        } catch (error) {
            console.error('Ошибка в основном процессе:', error);
            setErrorState(error.message || 'Произошла ошибка при получении данных');
        } finally {
            // Разблокируем кнопку и восстанавливаем текст
            getTimezoneBtn.disabled = false;
            getTimezoneBtn.innerHTML = originalBtnText;
        }
    }

    // Добавляем обработчик клика
    getTimezoneBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleGetTimezone();
    });

    // Инициализация: выводим пустые значения
    timezoneValueEl.innerHTML = '—';
    datetimeValueEl.innerHTML = '—';
    
    // Небольшое пояснение в консоль (для разработчика)
    console.log('Приложение готово. Нажмите кнопку для определения часового пояса.');
})();