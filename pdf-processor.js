import { PDFDocument, rgb } from 'pdf-lib';

export async function processPDF(file, onProgress) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // La marca de agua de NotebookLM suele estar en la esquina inferior derecha.
    // Proporciones aproximadas de la marca de agua:
    // Anchura: ~12% del ancho de la página
    // Altura: ~4% del alto de la página

    for (let i = 0; i < totalPages; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        // Coordenadas para la esquina inferior derecha
        const rectWidth = width * 0.15; // Un poco más ancho para asegurar
        const rectHeight = height * 0.06; // Un poco más alto para asegurar
        const x = width - rectWidth - (width * 0.02); // 2% de margen desde el borde derecho
        const y = height * 0.01; // 1% desde el borde inferior

        /* 
           ENFOQUE HIBRIDO 1: Detección de Objetos (Bisturí)
           Nota: pdf-lib no permite eliminar fácilmente objetos individuales por coordenadas sin reconstruir el flujo de contenido,
           pero podemos "tapar" el área con una precisión que mantenga la calidad original de los vectores y fuentes.
        */

        /*
           ENFOQUE HIBRIDO 2: Parche Inteligente
           En lugar de un parche blanco sólido, intentamos que coincida con el fondo.
           Para slides profesionales, solemos tener fondos blancos o colores sólidos.
           Si quisiéramos ser ultra-pro, usaríamos un canvas para samplear el color, 
           pero para este MVP de alta calidad, usaremos un rectángulo que tape la zona.
        */

        // Dibujamos un rectángulo del color del fondo (asumiendo blanco por defecto o permitiendo que el PDF sea original)
        // Pero para no perder calidad, NO rasterizamos. Dibujamos un rectángulo vectorial.

        // TODO: En una versión futura, podríamos samplear el color de fondo usando un canvas oculto.
        // Por ahora, usamos el color blanco que es el estándar de NotebookLM slides.
        page.drawRectangle({
            x: x,
            y: y,
            width: rectWidth,
            height: rectHeight,
            color: rgb(1, 1, 1), // Blanco puro
            opacity: 1,
        });

        // Feedback al usuario
        if (onProgress) {
            onProgress(Math.round(((i + 1) / totalPages) * 100), i + 1, totalPages);
        }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}
