# Rencana Revisi Backend: Otomatisasi Simpan Hasil AI ke PDF

Dokumen ini berisi langkah-langkah detail untuk mengubah sistem *generate* dokumen AI (Rekap, Laporan, MoM) di backend agar secara otomatis menyimpan hasil respons menjadi file PDF dan mencatatnya ke dalam database `Document`.

## 1. Instalasi Dependency (Library PDF)
Kita akan menggunakan library **`pdfkit`** untuk menghasilkan file PDF dari teks.

**Perintah Terminal (di direktori `be-scheduler`):**
```bash
npm install pdfkit
npm install --save-dev @types/pdfkit
```

## 2. Update Controller (`document.controller.ts`)
Fungsi-fungsi endpoint AI saat ini tidak menerima data **User** yang sedang login. Karena kita ingin menyimpan file ke database, kita memerlukan `userId` untuk mengisi field `modifiedBy`.

**Perubahan yang diperlukan:**
Menambahkan `@User('userId') userId: string` di fungsi `generateRecap`, `generateReport`, dan `generateMom`.

```typescript
// Contoh di DocumentController
@UseGuards(JwtAuthGuard)
@Post('generate/recap')
async generateRecap(
  @Body() body: { source_document_ids: string[]; context: string; title?: string },
  @User('userId') userId: string,
) {
  return this.documentService.generateRecap(
    body.source_document_ids,
    body.context,
    userId,
    body.title
  );
}
```

## 3. Update Service (`document.service.ts`)
Di bagian servis, kita akan menambahkan helper pembantu untuk membuat PDF, dan merevisi logika *generate*.

### a. Membuat Helper PDF Generator
Menambahkan fungsi privat baru `createPdfFromText(text, filename, title)` di dalam `DocumentService`.
```typescript
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';

private async createPdfFromText(text: string, filePath: string, title: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    
    doc.pipe(writeStream);
    
    // Tambahkan Judul
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    
    // Tambahkan Konten
    doc.fontSize(12).text(text, { align: 'justify' });
    
    doc.end();
    
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}
```

### b. Merevisi Logika Endpoint (Recap, Report, MoM)
Setiap fungsi AI diubah urutannya sebagai berikut:
1. Minta jawaban AI dengan `agentService.askAgent(...)`.
2. Hasilkan nama file PDF unik, misal: `Date.now()-recap.pdf`.
3. Tentukan `filePath` untuk disimpan di folder `/uploads/`.
4. Panggil `createPdfFromText()` dan tunggu hingga selesai.
5. Simpan record ke database menggunakan `this.documentRepo.create()` (sama dengan saat fungsi `uploadDocument`).
6. Kembalikan data lengkap hasil AI beserta URL *file_url* yang baru ke *frontend*.

**Contoh Refaktor pada fungsi `generateRecap`**:
```typescript
async generateRecap(sourceDocumentIds: string[], context: string, userId: string, customTitle?: string) {
  // ... (Ambil isi dokumen asal jika ada)
  const aiResponse = await this.agentService.askAgent(prompt);
  
  // 1. Setup metadata file
  const docTitle = customTitle || 'AI Generate - Recap';
  const filename = `${Date.now()}-recap.pdf`;
  const filePath = path.join(process.cwd(), 'uploads', filename);
  
  // 2. Buat File PDF
  await this.createPdfFromText(aiResponse.answer, filePath, docTitle);
  
  // 3. Simpan Ke Database
  const stat = fs.statSync(filePath);
  const newDoc = this.documentRepo.create({
    title: docTitle,
    file_url: `/uploads/${filename}`,
    file_size: stat.size,
    file_type: 'application/pdf',
    location: 'AI Generated',
    modifiedBy: { id: userId },
  });
  const savedDoc = await this.documentRepo.save(newDoc);
  
  return {
    result: aiResponse.answer,
    document: savedDoc,
    document_url: savedDoc.file_url,
  };
}
```

## 4. Frontend Integration (Optional tapi disarankan)
Apabila frontend membutuhkan judul dokumen (*title*), kita bisa menambahkan input `title` di Body request saat memanggil API.
