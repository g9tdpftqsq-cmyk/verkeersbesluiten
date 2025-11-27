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
            // Clean up address: remove extra spaces before opening parenthesis
            let cleanAddress = item.address.replace(/\s+\(/g, ' (');

            children.push(
                new Paragraph({
                    text: cleanAddress,
                    bullet: {
                        level: 0,
                    },
                })
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

    saveAs(blob, `Wijkbericht_${new Date().toISOString().split('T')[0]}.docx`);
    console.log("Word document generated!");
};
