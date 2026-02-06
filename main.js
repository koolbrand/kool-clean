import { processPDF } from './pdf-processor.js';

// PocketBase Initialization
const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'https://pocketbase.koolgrowth.com';
const pb = new window.PocketBase(pbUrl);

// Official Koolbrand Logo (Data URI)
const KOOLBRAND_LOGO_DATA = "data:image/png;base64,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";

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
    pageCountText.textContent = 'Iniciando...';
    processLabel.textContent = 'Procesando...';

    // Pequeña pausa para asegurar que el navegador muestre los nuevos labels
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        // Decodificamos el logo oficial directamente desde el Base64
        const base64Content = KOOLBRAND_LOGO_DATA.split(',')[1];
        const binaryString = window.atob(base64Content);
        const logoBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            logoBytes[i] = binaryString.charCodeAt(i);
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
