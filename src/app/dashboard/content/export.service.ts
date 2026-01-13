import { Injectable } from '@angular/core';
import { Content } from './content.model';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  exportToJSON(content: Content[]): void {
    const dataStr = JSON.stringify(content, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = 'content_export.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  exportToPDF(content: Content[]): void {
    const doc = new jsPDF();

    content.forEach((item, index) => {
      if (index > 0) {
        doc.addPage();
      }

      doc.setFontSize(16);
      doc.text(item.title, 10, 20);

      doc.setFontSize(12);
      const bodyLines = doc.splitTextToSize(item.body, 180);
      doc.text(bodyLines, 10, 40);

      doc.setFontSize(10);
      doc.text(`Author: ${item.authorEmail}`, 10, 280);
      doc.text(`Status: ${item.status}`, 10, 290);
      doc.text(`Created: ${new Date(item.createdAt).toLocaleDateString()}`, 10, 300);
    });

    doc.save('content_export.pdf');
  }

  async exportToWord(content: Content[]): Promise<void> {
    const children = content.flatMap(item => [
      new Paragraph({
        children: [
          new TextRun({
            text: item.title,
            bold: true,
            size: 32,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: item.body,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Author: ${item.authorEmail}`,
            italics: true,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Status: ${item.status}`,
            italics: true,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Created: ${new Date(item.createdAt).toLocaleDateString()}`,
            italics: true,
          }),
        ],
      }),
      new Paragraph({
        children: [],
      }),
    ]);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'content_export.docx';
    link.click();
  }
}
