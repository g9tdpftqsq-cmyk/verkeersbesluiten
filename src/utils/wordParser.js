import mammoth from 'mammoth';

export const extractTextFromDocx = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        console.error("Error reading Word file:", error);
        throw error;
    }
};

export const extractAddressFromText = (text) => {
    // Normalize whitespace
    const fullText = text.replace(/\s+/g, ' ');

    // "besluiten: met ingang van ... vast te stellen: [District] [Address]"
    const besluitenIndex = fullText.toLowerCase().indexOf('besluiten:');

    if (besluitenIndex !== -1) {
        const textAfterBesluiten = fullText.substring(besluitenIndex);
        const vastTeStellenIndex = textAfterBesluiten.toLowerCase().indexOf('vast te stellen:');

        if (vastTeStellenIndex !== -1) {
            let contentAfterTrigger = textAfterBesluiten.substring(vastTeStellenIndex + 'vast te stellen:'.length).trim();

            // Try to find a known district at the start
            const knownDistricts = [
                "West", "Noordwest", "Overvecht", "Noordoost", "Oost",
                "Binnenstad", "Zuid", "Zuidwest", "Leidsche Rijn", "Vleuten-De Meern"
            ];

            let district = null;
            // Sort by length desc to match "Leidsche Rijn" before "Rijn" if "Rijn" was a district (it's not in the list but good practice)
            knownDistricts.sort((a, b) => b.length - a.length);

            for (const d of knownDistricts) {
                if (contentAfterTrigger.toLowerCase().startsWith(d.toLowerCase())) {
                    district = d;
                    contentAfterTrigger = contentAfterTrigger.substring(d.length).trim();
                    break;
                }
            }

            if (district) {
                // The rest should be the address
                let address = contentAfterTrigger;

                // Rule: Stop strictly at the first semicolon
                const semicolonIndex = address.indexOf(';');
                if (semicolonIndex !== -1) {
                    address = address.substring(0, semicolonIndex).trim();
                }

                // Rule: Ensure it ends with ')'
                if (!address.endsWith(')')) {
                    address += ')';
                }

                return address;
            }
        }
    }

    return null;
};
