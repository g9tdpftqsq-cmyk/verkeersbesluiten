import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export const generateEmailFile = async (items) => {
  console.log("Generating email table document...");

  const tableRows = [
    // Header row
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: "Adres", bold: true })],
          width: { size: 35, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ text: "Wijk", bold: true })],
          width: { size: 20, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ text: "Datum", bold: true })],
          width: { size: 15, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ text: "URL", bold: true })],
          width: { size: 30, type: WidthType.PERCENTAGE }
        })
      ]
    })
  ];

  // Data rows
  items.forEach(item => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(item.address || "Niet gevonden")],
          }),
          new TableCell({
            children: [new Paragraph(item.district || "Niet gevonden")],
          }),
          new TableCell({
            children: [new Paragraph(item.date || "Onbekend")],
          }),
          new TableCell({
            children: [new Paragraph(item.sourceUrl || "")],
          })
        ]
      })
    );
  });

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: "Verkeersbesluiten Overzicht",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: "" }), // Spacer
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `verkeersbesluiten_tabel_${new Date().toISOString().split('T')[0]}.docx`);
  console.log("Email table document generated!");
};
