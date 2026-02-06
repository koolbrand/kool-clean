import { processPDF } from './pdf-processor.js';

// PocketBase Initialization
const pb = new window.PocketBase('https://pocketbase.koolgrowth.com');

const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
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
    if (pb.authStore.isValid) {
        loginView.classList.add('hidden');
        appView.classList.remove('hidden');
        userEmailText.textContent = pb.authStore.model.email;
    } else {
        loginView.classList.remove('hidden');
        appView.classList.add('hidden');
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('login-btn');

    try {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Entrando...';
        await pb.collection('users').authWithPassword(email, password);
        checkAuth();
    } catch (error) {
        alert('Error de login: ' + error.message);
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Entrar';
    }
});

logoutBtn.addEventListener('click', () => {
    pb.authStore.clear();
    checkAuth();
    resetApp();
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
    pageCountText.textContent = 'Analizando páginas...';
    processLabel.textContent = 'Procesando...';

    try {
        processedBlob = await processPDF(file, (percent, current, total) => {
            progressBar.style.width = `${percent}%`;
            percentageText.textContent = `${percent}%`;
            pageCountText.textContent = `Página ${current} de ${total}`;
        });

        // Completion
        processLabel.textContent = '¡Completado!';
        processLabel.style.color = '#4ade80';
        actionArea.classList.remove('hidden');
    } catch (error) {
        console.error(error);
        alert('Hubo un error al procesar el PDF. Asegúrate de que no esté protegido por contraseña.');
        resetApp();
    }
}

downloadBtn.addEventListener('click', () => {
    if (!processedBlob) {
        console.error("No hay archivo procesado disponible.");
        return;
    }

    console.log("Iniciando descarga de:", originalFileName);
    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `limpio_${originalFileName}`;

    document.body.appendChild(a);

    // Pequeño delay para asegurar que el DOM ha registrado el elemento
    setTimeout(() => {
        a.click();

        // Limpieza después de un pequeño delay
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
