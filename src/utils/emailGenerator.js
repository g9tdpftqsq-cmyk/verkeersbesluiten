import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export const generateEmailFile = async (items) => {
  console.log("Generating email table document...");

  // Helper function to format date as text
  const formatDateAsText = (dateStr) => {
    if (!dateStr) return "Onbekend";
    const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
      'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

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
    // Clean up address: remove extra spaces
    const cleanAddress = (item.address || "Niet gevonden").replace(/\s+/g, ' ').trim();

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(cleanAddress)],
          }),
          new TableCell({
            children: [new Paragraph(item.district || "Niet gevonden")],
          }),
          new TableCell({
            children: [new Paragraph(formatDateAsText(item.date))],
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
          text: "Hoi collega's,",
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: "Zouden jullie de nieuwe verkeersbesluiten aub op onze website (https://www.utrecht.nl/wonen-en-leven/duurzame-stad/vervoer/elektrisch-vervoer/openbare-laadpalen) kunnen publiceren? Dank weer!",
          spacing: { after: 400 }
        }),
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Redactie_mail_${new Date().toISOString().split('T')[0]}.docx`);
  console.log("Email table document generated!");
};
