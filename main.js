import { processPDF } from './pdf-processor.js';

// PocketBase Initialization
const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'https://pocketbase.koolgrowth.com';
const pb = new window.PocketBase(pbUrl);

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
        // Generamos el logo de Koolbrand on-the-fly con un Canvas
        // Esto evita tener que subir archivos binarios y asegura máxima nitidez
        const logoBytes = await generateKoolLogo();

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

// Función para generar el logo de Koolbrand dinámicamente
async function generateKoolLogo() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 120;

    // Fondo transparente (ya lo es por defecto)

    // Texto "kool"
    ctx.font = 'bold 80px Inter, sans-serif';
    ctx.fillStyle = '#84cc16'; // Verde Kool
    ctx.fillText('kool', 10, 80);

    // Texto "brand"
    const koolWidth = ctx.measureText('kool').width;
    ctx.fillStyle = '#374151'; // Gris oscuro
    ctx.fillText('brand', 10 + koolWidth, 80);

    // Tagline "we [corazón] brands"
    ctx.font = '300 30px Inter, sans-serif';
    ctx.fillStyle = '#6b7280'; // Gris medio
    ctx.fillText('we', 15, 110);
    
    const weWidth = ctx.measureText('we ').width;
    ctx.fillStyle = '#84cc16'; // Corazón verde
    ctx.fillText('❤', 15 + weWidth, 110);
    
    const heartWidth = ctx.measureText('❤ ').width;
    ctx.fillStyle = '#6b7280';
    ctx.fillText('brands', 15 + weWidth + heartWidth, 110);

    // Convertir a bytes
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            blob.arrayBuffer().then(resolve);
        }, 'image/png');
    });
}
