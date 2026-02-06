import { PDFDocument, rgb } from 'pdf-lib';

export async function processPDF(file, logoBytes, onProgress) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Embed logo if provided
    let logoImage = null;
    if (logoBytes) {
        logoImage = await pdfDoc.embedPng(logoBytes);
    }

    for (let i = 0; i < totalPages; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        // Proporciones mejoradas para cubrir perfectamente el área de NotebookLM
        const rectWidth = width * 0.18; 
        const rectHeight = height * 0.06; 
        const x = width - rectWidth; // Sin margen derecho
        const y = 0; // Desde el fondo

        // Dibamos el rectángulo base (blanco sólido)
        page.drawRectangle({
            x: x,
            y: y,
            width: rectWidth,
            height: rectHeight,
            color: rgb(1, 1, 1),
            opacity: 1,
        });

        // Si tenemos logo, lo ponemos encima.
        // Como el logo ya tiene fondo blanco propio (del canvas), se verá perfecto.
        if (logoImage) {
            const logoScale = 0.14;
            const logoDims = logoImage.scale(logoScale);
            // Centramos el logo dentro del parche blanco
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
            onProgress(Math.round(((i + 1) / totalPages) * 100), i + 1, totalPages);
        }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}
