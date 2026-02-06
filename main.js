import { processPDF } from './pdf-processor.js';

// PocketBase Initialization
const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'https://pocketbase.koolgrowth.com';
const pb = new window.PocketBase(pbUrl);

// Official Koolbrand Logo (Data URI)
const KOOLBRAND_LOGO_DATA = "data:image/png;base64,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) | Assemble pages.";

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
        // Decodificamos el logo oficial directamente desde el Base64
        const base64Content = KOOLBRAND_LOGO_DATA.split(',')[1];
        const binaryString = window.atob(base64Content);
        const logoBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            logoBytes[i] = binaryString.charCodeAt(i);
        }

        processedBlob = await processPDF(file, logoBytes, (percent, current, total) => {
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
