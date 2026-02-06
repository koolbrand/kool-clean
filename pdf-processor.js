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

        // 1. Masking bottom-right (Main NotebookLM watermark)
        // Adjusting to cover the entire text including the final "M"
        const brWidth = width * 0.20;
        const brHeight = height * 0.06;
        const brX = width - brWidth;
        const brY = 0;

        page.drawRectangle({
            x: brX,
            y: brY,
            width: brWidth,
            height: brHeight,
            color: rgb(1, 1, 1),
            opacity: 1,
        });

        // 2. Masking top area (Safety measure, even smaller)
        const trWidth = width * 0.18;
        const trHeight = height * 0.03;
        const trX = width - trWidth - (width * 0.01);
        const trY = height - trHeight - (height * 0.01);

        page.drawRectangle({
            x: trX,
            y: trY,
            width: trWidth,
            height: trHeight,
            color: rgb(1, 1, 1),
            opacity: 1,
        });

        // Si tenemos logo, lo ponemos centrado en el rectángulo blanco
        if (logoImage) {
            const logoScale = 0.22; // Un poco más grande para que se vea bien
            const logoDims = logoImage.scale(logoScale);

            // Centrado horizontal en el rectángulo blanco
            const logoX = brX + (brWidth - logoDims.width) / 2;
            // Centrado vertical en el rectángulo blanco
            const logoY = brY + (brHeight - logoDims.height) / 2;

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
