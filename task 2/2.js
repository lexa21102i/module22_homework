const btn = document.querySelector('.j-btn-test');
const iconContainer = document.querySelector('.btn_icon');

// icon_01: (bi-arrow-down-left-circle-fill)
const icon01svg = `<svg class="bi bi-arrow-down-left-circle-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 8A8 8 0 1 0 0 8a8 8 0 0 0 16 0m-5.904-2.803a.5.5 0 1 1 .707.707L6.707 10h2.768a.5.5 0 0 1 0 1H5.5a.5.5 0 0 1-.5-.5V6.525a.5.5 0 0 1 1 0v2.768z"/>
  </svg>`;

// icon_02: (bi-arrow-down-left-circle)
const icon02svg = `<svg class="bi bi-arrow-down-left-circle" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-5.904-2.854a.5.5 0 1 1 .707.708L6.707 9.95h2.768a.5.5 0 1 1 0 1H5.5a.5.5 0 0 1-.5-.5V6.475a.5.5 0 1 1 1 0v2.768z"/>
  </svg>`;

  let isIconFilled = true;
        
        // Функция замены иконки
        function toggleIcon() {
            if (isIconFilled) {
                iconContainer.innerHTML = icon02svg;
                isIconFilled = false;
            } else {
                iconContainer.innerHTML = icon01svg;
                isIconFilled = true;
            }
        }
        
        // Обработчик клика: переключаем иконку
        btn.addEventListener('click', () => {
            toggleIcon();
        });