import Tesseract from 'tesseract.js';

export const extractAddresses = async (imageBlob) => {
  try {
    const result = await Tesseract.recognize(
      imageBlob,
      'nld', // Dutch language
      { logger: m => console.log(m) }
    );

    const text = result.data.text;
    console.log('OCR Output:', text);

    // Extract street names - look for patterns like "VB [Street Name] Vaststel"
    // Common pattern: VB followed by street name, then "Vaststel" or similar
    const lines = text.split('\n');
    const addresses = [];

    for (const line of lines) {
      let cleaned = line.trim();

      // First, try to remove district prefixes if they are at the start
      cleaned = cleaned.replace(/^(Leidsche\s*Rijn|Vleuten[\s-]*De\s*Meern|Rijn|Meern)[\s.,;:]+/i, '').trim();

      // Now, if VB was present, remove it and the E8c stuff
      if (line.includes('VB')) {
        cleaned = cleaned
          .replace(/.*VB\s+/i, '') // Remove everything before and including VB
          .replace(/\s+(E8|E8c|OB|nr|Vaststel|Vats|kB|cOB|gj|gi|\d+kB).*$/i, '') // Remove everything starting from E8/E8c etc.
          .trim();

        // Run the district check again just in case VB removal exposed it
        cleaned = cleaned.replace(/^(Leidsche\s*Rijn|Vleuten[\s-]*De\s*Meern|Rijn|Meern)[\s.,;:]+/i, '').trim();
      }

      // If after all cleaning, we have something left, add it
      if (cleaned && cleaned.length > 3) {
        addresses.push(cleaned);
      }
    }

    console.log('Extracted addresses:', addresses);
    return addresses;
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
};
