export const fetchAnnouncements = async (date, searchQuery = '') => {
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD

    // CQL Query Construction
    // User requested to search PURELY by address, removing date and creator filters.
    // We assume searchQuery (the address) is always provided in this flow.
    let query = searchQuery;

    // SRU Endpoint
    const url = `/api/sru/Search?version=1.2&operation=searchRetrieve&x-connection=oep&startRecord=1&maximumRecords=50&query=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const xmlText = await response.text();
        return parseSRUResponse(xmlText);
    } catch (error) {
        console.error('Fetch Error:', error);
        throw error;
    }
};

const parseSRUResponse = (xmlText) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const records = xmlDoc.getElementsByTagName("record");
    const results = [];

    for (let i = 0; i < records.length; i++) {
        const record = records[i];

        // Helper to safely get text content from namespaced elements
        const getText = (tag) => {
            const el = record.getElementsByTagNameNS("*", tag)[0] || record.getElementsByTagName(tag)[0];
            return el ? el.textContent.trim() : "";
        };

        const title = getText("title");
        const url = getText("url");
        const date = getText("date");
        const type = getText("type");
        const creator = getText("creator");

        if (url) {
            results.push({
                title,
                url, // The URL from SRU is usually absolute
                date,
                type,
                organization: creator,
                meta: `${date} | ${creator}`
            });
        }
    }

    return results;
};
