/* ========================================
   NOVA STORE — Authentication Logic
   ======================================== */

const Auth = (() => {
    function initLoginPage() {
        const loginTab = document.getElementById('tab-login');
        const registerTab = document.getElementById('tab-register');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (loginTab && registerTab) {
            loginTab.addEventListener('click', () => {
                loginTab.classList.add('active');
                registerTab.classList.remove('active');
                loginForm.style.display = 'flex';
                registerForm.style.display = 'none';
            });

            registerTab.addEventListener('click', () => {
                registerTab.classList.add('active');
                loginTab.classList.remove('active');
                registerForm.style.display = 'flex';
                loginForm.style.display = 'none';
            });
        }

        // Login form
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(loginForm);
                const email = formData.get('email');
                const password = formData.get('password');

                const result = await API.login(email, password);
                if (result.error) {
                    App.showToast(result.error, 'error');
                } else {
                    App.showToast(`Bem-vindo, ${result.user.name}! 🎉`);
                    setTimeout(() => window.location.href = 'index.html', 1000);
                }
            });
        }

        // Register form
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(registerForm);
                const name = formData.get('name');
                const email = formData.get('email');
                const password = formData.get('password');

                const result = await API.register(name, email, password);
                if (result.error) {
                    App.showToast(result.error, 'error');
                } else {
                    App.showToast(`Conta criada com sucesso! 🎉`);
                    setTimeout(() => window.location.href = 'index.html', 1000);
                }
            });
        }
    }

    // Auto init on login page
    document.addEventListener('DOMContentLoaded', () => {
        if (document.body.dataset.page === 'login') {
            initLoginPage();
        }
    });

    return { initLoginPage };
})();
