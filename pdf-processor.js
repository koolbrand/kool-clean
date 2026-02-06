import { PDFDocument, rgb } from 'pdf-lib';

export async function processPDF(file, logoBytes, onProgress) {
    if (onProgress) onProgress(0, 0, 0, 'Iniciando lectura del archivo...');
    const arrayBuffer = await file.arrayBuffer();
    
    // Yield to allow UI to show "Cargando..."
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (onProgress) onProgress(0, 0, 0, 'Analizando estructura del PDF...');
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Yield after heavy load
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Embed logo if provided
    let logoImage = null;
    if (logoBytes) {
        if (onProgress) onProgress(0, 0, totalPages, 'Preparando logo oficial...');
        logoImage = await pdfDoc.embedPng(logoBytes);
        await new Promise(resolve => setTimeout(resolve, 20));
    }

    for (let i = 0; i < totalPages; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        // Proporciones mejoradas para cubrir perfectamente el área de NotebookLM
        const rectWidth = width * 0.18;
        const rectHeight = height * 0.08; 
        const x = width - rectWidth; 
        const y = 0; 

        // Dibujamos el parche blanco sólido para borrar el original
        page.drawRectangle({
            x: x,
            y: y,
            width: rectWidth,
            height: rectHeight,
            color: rgb(1, 1, 1),
            opacity: 1,
        });

        // Si tenemos logo, lo ponemos encima centrado
        if (logoImage) {
            const logoScale = 0.20; 
            const logoDims = logoImage.scale(logoScale);
            
            const logoX = width - logoDims.width - (width * 0.015);
            const logoY = (rectHeight - logoDims.height) / 2;

            page.drawImage(logoImage, {
                x: logoX,
                y: logoY,
                width: logoDims.width,
                height: logoDims.height,
            });
        }

        if (onProgress) {
            // Reservamos el 10% final para el guardado
            const progress = Math.round(((i + 1) / totalPages) * 90);
            onProgress(progress, i + 1, totalPages, `Procesando página ${i + 1} de ${totalPages}...`);
            // Pausa un poco más larga para asegurar que el navegador respire
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    if (onProgress) onProgress(95, totalPages, totalPages, 'Generando archivo final (esto puede tardar)...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const pdfBytes = await pdfDoc.save();
    
    if (onProgress) onProgress(100, totalPages, totalPages, '¡Proceso finalizado!');
    return new Blob([pdfBytes], { type: 'application/pdf' });
}
