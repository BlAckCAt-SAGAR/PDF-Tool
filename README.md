# PDF Studio 📄✨

A comprehensive, fully client-side web application for all your PDF needs. Built with modern web technologies, this tool allows you to convert, edit, compress, and secure your PDF files directly in your browser without sending any data to a server—ensuring 100% privacy and lightning-fast performance.

## 🌟 Features

### 🔄 Conversions
*   **Word to PDF:** Convert `.doc` and `.docx` files to PDF. Retains text formatting, headings, lists, tables, and embedded images.
*   **Excel to PDF:** Convert spreadsheets (`.xls`, `.xlsx`, `.csv`) into PDF documents.
*   **PowerPoint to PDF:** Convert presentations (`.ppt`, `.pptx`) to PDF, automatically adjusting page sizes to match slide dimensions (e.g., 16:9 widescreen).
*   **Images to PDF:** Combine multiple images (JPG, PNG, GIF) into a single PDF document.
*   **HTML to PDF:** Convert HTML files to PDF.
*   **Text to PDF:** Convert plain text files (`.txt`) to PDF.
*   **PDF to Word / Excel / Images:** Extract text and images from PDF files into other formats.

### ✂️ Split & Organize
*   **Split by Range:** Extract specific pages (e.g., `1-3, 5`) from a PDF.
*   **Extract All Pages:** Split a multi-page PDF into individual single-page PDFs.
*   **Split by Size:** Split large PDFs into smaller parts based on a target file size.
*   **Remove Pages:** Delete unwanted pages from your document.
*   **Page Organizer:** Visually reorder and manage pages within your PDF.

### 🛠️ Edit & Modify
*   **Rotate Pages:** Rotate specific pages or the entire document.
*   **Add Watermark:** Apply custom text watermarks to your PDF pages.
*   **Sign PDF:** Add a digital signature or signature image to your document.
*   **Convert to PDF/A:** Convert standard PDFs into the PDF/A format for long-term archiving.

### 🗜️ Compress
*   **Quick Compression:** Fast compression with default settings.
*   **Target Size Compression:** Compress a PDF to meet a specific file size limit.
*   **DPI Compression:** Reduce image DPI within the PDF to save space.
*   **Advanced Compression:** Fine-tune image quality, grayscale conversion, and resolution settings.

### 🔒 Security
*   **Password Protect:** Encrypt your PDFs with a password.
*   **Unlock PDF:** Remove password protection from PDFs (requires the original password).
*   **Redact PDF:** Permanently black out sensitive information.

## 🚀 Technologies Used

This project relies on several powerful JavaScript libraries to process files entirely on the client side:

*   [pdf-lib](https://pdf-lib.js.org/) - For creating, modifying, and editing PDF documents.
*   [jsPDF](https://github.com/parallax/jsPDF) - For generating PDFs from text and HTML.
*   [mammoth.js](https://github.com/mwilliamson/mammoth.js) - For converting DOCX files to HTML/Text.
*   [SheetJS (xlsx)](https://sheetjs.com/) - For reading and parsing Excel/CSV files.
*   [JSZip](https://stuk.github.io/jszip/) - For reading inside PPTX (ZIP) archives.

## 💻 Getting Started

Since this application runs entirely in the browser, there is no complicated backend setup required.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/BlAckCAt-SAGAR/PDF-Tool.git
    cd PDF-Tool
    ```
2.  **Run locally:**
    You can simply open the `index.html` file in your preferred web browser. However, for the best experience (and to avoid CORS issues with some local files), it is recommended to run a simple local HTTP server.
    
    Using Node.js:
    ```bash
    npx serve .
    ```
    Or using Python:
    ```bash
    python -m http.server 8000
    ```
3.  **Deploy:**
    You can easily deploy this static site to platforms like Netlify, Vercel, or GitHub Pages.

## 🛡️ Privacy First

**Zero Data Collection:** Every single operation—conversion, compression, encryption—happens locally in your web browser. Your files never leave your device, ensuring complete privacy and security for sensitive documents.
