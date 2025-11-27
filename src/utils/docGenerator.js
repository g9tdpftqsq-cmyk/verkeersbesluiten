import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

export const generateWordDoc = async (items) => {
    // items is an array of { district, address, sourceUrl, date, ... }
    console.log(`Generating Word document for ${items.length} items:`, items);

    if (!items || items.length === 0) {
        console.error("No items to generate document for!");
        alert("No data to generate document. Please process some addresses first.");
        return;
    }

    const children = [
        new Paragraph({
            text: "Verkeersbesluiten Overzicht",
            heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: "" }), // Spacer
    ];

    // Group items by district
    const districts = {};
    items.forEach(item => {
        const dist = item.district || "Onbekend";
        if (!districts[dist]) {
            districts[dist] = [];
        }
        districts[dist].push(item);
    });

    Object.keys(districts).sort().forEach(districtName => {
        // District Heading
        children.push(
            new Paragraph({
                text: districtName,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
            })
        );

        // List of addresses in this district
        districts[districtName].forEach(item => {
            children.push(
                new Paragraph({
                    text: `${item.address} (Datum: ${item.date || 'Onbekend'})`,
                    bullet: {
                        level: 0,
                    },
                }),
                // Optional: Add link in a separate line or same line?
                // User said "puntsgewijs alle adressen per wijk".
                // Let's keep it simple. Maybe add the link as a sub-bullet or just text?
                // Let's add the link in a separate paragraph below or just keep it clean.
                // "adres pak je tot de ; en daar plaats je een ) om hem netjes af te sluiten"
                // The address already has the closing parenthesis from the parser.
            );
        });
    });

    console.log("Creating document...");
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: children,
            },
        ],
    });

    console.log("Converting to blob...");
    const blob = await Packer.toBlob(doc);
    console.log("Blob created, size:", blob.size, "bytes");

    // Create a proper blob with correct MIME type
    const properBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    // Add timestamp to filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Verkeersbesluiten_${timestamp}.docx`;

    console.log("Triggering download:", filename);

    // Use manual download link for better compatibility
    const url = URL.createObjectURL(properBlob);
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

    console.log("Download triggered!");
};
