import { saveAs } from "file-saver";

export const generateEmailFile = (items) => {
  // items is an array of { district, address, sourceUrl, date, ... }
  console.log(`Generating email file for ${items.length} items:`, items);

  if (!items || items.length === 0) {
    console.error("No items to generate email for!");
    alert("No data to generate email. Please process some addresses first.");
    return;
  }

  const tableRows = items.map(item => `
    <tr>
      <td>${item.address || 'Onbekend'}</td>
      <td>${item.district || 'Onbekend'}</td>
      <td>${item.date || 'Onbekend'}</td>
      <td><a href="${item.sourceUrl}">Link</a></td>
    </tr>
  `).join('');

  const htmlBody = `
    <html>
      <body>
        <p>Beste redactie,</p>
        <p>Hierbij een overzicht van de gevonden verkeersbesluiten:</p>
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr>
              <th>Adres</th>
              <th>Wijk</th>
              <th>Datum</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <p>Met vriendelijke groet,</p>
      </body>
    </html>
  `;

  const emlContent = `To: redactie@utrecht.nl
Subject: Overzicht Verkeersbesluiten
Content-Type: text/html; charset="UTF-8"

${htmlBody}
`;

  console.log("Creating email blob...");
  const blob = new Blob([emlContent], {
    type: "message/rfc822"
  });
  console.log("Email blob created, size:", blob.size, "bytes");

  // Add timestamp to filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Verkeersbesluiten_${timestamp}.eml`;

  console.log("Triggering email download:", filename);

  // Use manual download link for better compatibility
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);

  console.log("Email download triggered!");
};
