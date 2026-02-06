import { processPDF } from './pdf-processor.js';

// PocketBase Initialization
const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'https://pocketbase.koolgrowth.com';
const pb = new window.PocketBase(pbUrl);

// Official Koolbrand Logo (Data URI)
const KOOLBRAND_LOGO_DATA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const loginLink = document.getElementById('login-link');
const closeLogin = document.getElementById('close-login');
const logoutBtn = document.getElementById('logout-btn');
const userEmailText = document.getElementById('user-email');

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const statusArea = document.getElementById('status-area');
const progressBar = document.getElementById('progress-fill');
const percentageText = document.getElementById('percentage');
const pageCountText = document.getElementById('page-count');
const fileNameText = document.getElementById('file-name');
const actionArea = document.getElementById('action-area');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');
const processLabel = document.getElementById('process-label');

// Auth Flow
function checkAuth() {
    if (pb.authStore.isValid && pb.authStore.model) {
        appView.classList.remove('hidden');
        loginView.classList.add('hidden');
        userEmailText.textContent = pb.authStore.model.email;
    } else {
        appView.classList.add('hidden');
        loginView.classList.remove('hidden');
        userEmailText.textContent = '';

        // Reset login button state
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.textContent = 'Entrar';
            loginBtn.disabled = false;
            loginBtn.style.backgroundColor = '';
        }

        // Focus first input
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.focus();
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('login-btn');

    try {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner"></span> Entrando...';

        // Simular un poco de feedback para el look premium
        await new Promise(resolve => setTimeout(resolve, 800));

        await pb.collection('users').authWithPassword(email, password);

        // Success feedback
        loginBtn.style.backgroundColor = 'var(--success)';
        loginBtn.textContent = '¡Bienvenido!';

        await new Promise(resolve => setTimeout(resolve, 500));
        loginView.classList.add('hidden');
        checkAuth();
    } catch (error) {
        alert('Ups! No hemos podido entrar: ' + error.message);
        loginBtn.style.backgroundColor = '';
        loginBtn.textContent = 'Entrar';
    } finally {
        loginBtn.disabled = false;
    }
});

logoutBtn.addEventListener('click', () => {
    if (confirm('¿Seguro que quieres cerrar sesión?')) {
        pb.authStore.clear();
        checkAuth();
    }
});

// Initial Auth Check
checkAuth();

let processedBlob = null;
let originalFileName = "";

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        handleFile(file);
    } else {
        alert('Por favor, sube un archivo PDF válido.');
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

async function handleFile(file) {
    originalFileName = file.name;
    fileNameText.textContent = originalFileName;

    // UI Transitions
    dropZone.classList.add('hidden');
    statusArea.classList.remove('hidden');
    actionArea.classList.add('hidden');
    progressBar.style.width = '0%';
    percentageText.textContent = '0%';
    pageCountText.textContent = 'Iniciando...';
    processLabel.textContent = 'Procesando...';
    processLabel.style.color = ''; // Reset color

    // Pequeña pausa para asegurar que el navegador muestre los nuevos labels
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        // Cargar logo Koolbrand oficial desde archivo local
        let logoBytes = null;
        try {
            const logoResponse = await fetch('/koolbrand-logo.png');
            if (logoResponse.ok) {
                const logoBuffer = await logoResponse.arrayBuffer();
                logoBytes = new Uint8Array(logoBuffer);
            }
        } catch (logoError) {
            console.warn('Error al cargar koolbrand-logo.png:', logoError);
            // Intentar fallback si el logo local falla
        }

        processedBlob = await processPDF(file, logoBytes, (percent, current, total, status) => {
            progressBar.style.width = `${percent}%`;
            percentageText.textContent = `${percent}%`;
            if (status) {
                pageCountText.textContent = status;
            } else {
                pageCountText.textContent = `Página ${current} de ${total}`;
            }
        });

        // Completion
        processLabel.textContent = '¡Completado!';
        processLabel.style.color = '#4ade80';
        actionArea.classList.remove('hidden');
    } catch (error) {
        console.error(error);
        alert('Hubo un error al procesar el PDF. Asegúrate de que no esté protegido por contraseña o sea demasiado pesado.');
        resetApp();
    }
}

downloadBtn.addEventListener('click', () => {
    if (!processedBlob) {
        console.error("No hay archivo procesado disponible.");
        return;
    }

    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `limpio_${originalFileName}`;

    document.body.appendChild(a);

    setTimeout(() => {
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }, 50);
});

resetBtn.addEventListener('click', resetApp);

function resetApp() {
    dropZone.classList.remove('hidden');
    statusArea.classList.add('hidden');
    fileInput.value = '';
    processedBlob = null;
}
checkAuth();
