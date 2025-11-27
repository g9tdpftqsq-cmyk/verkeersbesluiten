export const fetchAndParseDetail = async (url) => {
    // Ensure we use the proxy if it's a relative URL or matches the target domain
    let fetchUrl = url;
    if (url.startsWith('https://zoek.officielebekendmakingen.nl')) {
        fetchUrl = url.replace('https://zoek.officielebekendmakingen.nl', '/api');
    } else if (!url.startsWith('http') && !url.startsWith('/api')) {
        fetchUrl = `/api/${url}`;
    }

    try {
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        return parseDetailHtml(html);
    } catch (error) {
        console.error('Detail Fetch Error:', error);
        throw error;
    }
};

const parseDetailHtml = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find the content container
    const contentDiv = doc.querySelector('#broodtekst') || doc.body;
    const paragraphs = Array.from(contentDiv.querySelectorAll('p'));

    let district = null;
    let address = null;
    let foundTrigger = false;

    const knownDistricts = [
        "West", "Noordwest", "Overvecht", "Noordoost", "Oost",
        "Binnenstad", "Zuid", "Zuidwest", "Leidsche Rijn", "Vleuten-De Meern"
    ];

    for (let i = 0; i < paragraphs.length; i++) {
        const text = paragraphs[i].textContent.trim();

        // Look for the trigger phrase
        // "met ingang van ... vast te stellen:"
        if (text.toLowerCase().includes('met ingang van') && text.toLowerCase().includes('vast te stellen:')) {
            foundTrigger = true;

            // Look ahead for District
            let j = i + 1;
            while (j < paragraphs.length && !district) {
                const nextText = paragraphs[j].textContent.trim();
                if (nextText) {
                    // Check if this text matches a known district (case-insensitive)
                    const match = knownDistricts.find(d => d.toLowerCase() === nextText.toLowerCase());
                    if (match) {
                        district = match;
                    } else {
                        // Fallback: if it's not a known district, maybe it's the address directly?
                        // But user says district comes first.
                        // Let's assume it IS the district if it's short, or log a warning.
                        // For now, take it as district if it's reasonably short, or try to match partial?
                        // User example: "Oost" is on its own line.
                        district = nextText;
                    }
                }
                j++;
            }

            // Look ahead for Address (starting from where we found district)
            while (j < paragraphs.length && !address) {
                const nextText = paragraphs[j].textContent.trim();
                if (nextText) {
                    address = nextText;

                    // Rule: Stop strictly at the first semicolon
                    const semicolonIndex = address.indexOf(';');
                    if (semicolonIndex !== -1) {
                        address = address.substring(0, semicolonIndex).trim();
                    }

                    // Rule: Ensure it ends with ')'
                    if (!address.endsWith(')')) {
                        address += ')';
                    }
                }
                j++;
            }

            // Once found, we can stop
            break;
        }
    }

    if (!district || !address) {
        console.warn("Could not find district or address pattern.");
    }

    return { district, address };
};
