import { useState, useEffect } from 'react'
import './App.css'
import { fetchAnnouncements } from './utils/api'
import { extractAddresses } from './utils/ocr'
import { fetchAndParseDetail } from './utils/detailParser'
import { generateWordDoc } from './utils/docGenerator'
import { generateEmailFile } from './utils/emailGenerator'
import { extractTextFromDocx, extractAddressFromText } from './utils/wordParser'

function App() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [announcements, setAnnouncements] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(false)
  const [processedResults, setProcessedResults] = useState([])
  const [processing, setProcessing] = useState(false)
  const [logs, setLogs] = useState([])
  const [motivationalMessage, setMotivationalMessage] = useState('')

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Fetch logic is now part of the batch process, but we keep this for manual checks if needed
  const handleFetch = async () => {
    setLoading(true)
    try {
      const results = await fetchAnnouncements(new Date(date))
      // setAnnouncements(results) // This line is commented out as announcements are now processed in batch
    } catch (error) {
      console.error(error)
      alert('Failed to fetch announcements')
    } finally {
      setLoading(false)
    }
  }



  const handleWordUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;


    setLoading(true);
    addLog(`Processing ${files.length} Word files...`, 'info');
    try {
      const newAddresses = [];
      for (const file of files) {
        try {
          const text = await extractTextFromDocx(file);
          const address = extractAddressFromText(text);
          if (address) {
            newAddresses.push(address);
            addLog(`Extracted address from ${file.name}: ${address}`, 'success');
          } else {
            console.warn(`Could not extract address from ${file.name}`);
            addLog(`No address found in ${file.name}`, 'warning');
          }
        } catch (err) {
          console.error(`Error parsing ${file.name}:`, err);
          addLog(`Error parsing ${file.name}: ${err.message}`, 'error');
        }
      }
      setAddresses(prev => [...prev, ...newAddresses]);
    } catch (error) {
      console.error("Word upload error:", error);
      addLog(`Word upload failed: ${error.message}`, 'error');
      alert("Failed to process Word files.");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessAll = async () => {
    if (addresses.length === 0) {
      alert('No addresses to process!');
      return;
    }

    setProcessing(true);
    setProcessedResults([]);
    setLogs([]); // Clear previous logs on new run
    addLog(`Starting batch process for ${addresses.length} addresses...`, 'info');

    const motivationalMessages = [
      'JE KAN HET!',
      'SAMEN HALEN WE ONZE DOELEN',
      'BIJNA KLAAR...',
      'GEWELDIG BEZIG!',
      'NOG EVEN VOLHOUDEN!',
      'TOP WERK!'
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      setMotivationalMessage(motivationalMessages[messageIndex % motivationalMessages.length]);
      messageIndex++;
    }, 2000);

    const results = [];
    const errors = [];

    try {
      for (const address of addresses) {
        try {
          // Search for just the street name (without E8c requirement)
          // We'll filter for E8c in the results
          const cleanAddress = address.trim();

          addLog(`Searching API for: "${cleanAddress}" (Date: ${date})`, 'info');
          // The API now strictly filters for E8c, Utrecht, and Date.
          // We pass the address as an additional search term.
          const searchResults = await fetchAnnouncements(new Date(date), `"${cleanAddress}"`);

          addLog(`API returned ${searchResults.length} results for "${cleanAddress}"`, searchResults.length > 0 ? 'success' : 'warning');

          // If we find matches, parse the first one (most relevant usually)
          if (searchResults.length > 0) {
            const bestMatch = searchResults[0];
            addLog(`Parsing detail page: ${bestMatch.url}`, 'info');

            const details = await fetchAndParseDetail(bestMatch.url);

            if (details.district && details.address) {
              addLog(`Successfully parsed: ${details.district} - ${details.address}`, 'success');
              results.push({
                ...details,
                sourceUrl: bestMatch.url,
                date: bestMatch.date || date,
                originalAddress: address
              });
            } else {
              addLog(`Failed to parse details from ${bestMatch.url}`, 'error');
              errors.push(`Parsing failed for: ${cleanAddress}`);
            }

          } else {
            console.warn(`No results found for "${cleanAddress}"`);
            errors.push(`No results for: ${cleanAddress}`);
          }
        } catch (itemError) {
          console.error(`Error processing "${address}":`, itemError);
          addLog(`Error processing "${address}": ${itemError.message}`, 'error');
          errors.push(`Error processing ${address}: ${itemError.message}`);
        }
      }

      setProcessedResults(results);

      // Show summary
      if (errors.length > 0) {
        addLog(`Completed with ${errors.length} errors.`, 'warning');
        alert(`Processing completed:\n\n✓ Successfully processed: ${results.length} items\n\n⚠ Issues:\n${errors.join('\n')}`);
      } else if (results.length === 0) {
        addLog('No matching announcements found.', 'error');
        alert('No matching announcements found for any of the addresses.\n\nTip: Make sure the date matches when the announcements were published.');
      } else {
        addLog('Batch processing completed successfully.', 'success');
      }
    } catch (error) {
      console.error("Batch processing error:", error);
      addLog(`Critical batch error: ${error.message}`, 'error');
      alert(`Error during batch processing: ${error.message}`);
    } finally {
      clearInterval(messageInterval);
      setMotivationalMessage('');
      setProcessing(false);
    }
  };

  return (
    <div className="container">
      <h1>Verkeersbesluiten handmatig invoeren? Nah..</h1>



      <div className="content-grid">
        <div className="panel">
          <h2>1. Upload Word Bestanden</h2>

          <div className="upload-section">
            <p>Upload Word bestanden met verkeersbesluiten:</p>
            <input
              type="file"
              multiple
              accept=".docx"
              onChange={handleWordUpload}
              disabled={loading || processing}
            />
          </div>

          {addresses.length > 0 && (
            <>
              <h3>Extracted Addresses:</h3>
              <ul>
                {addresses.map((addr, i) => (
                  <li key={i}>{addr}</li>
                ))}
              </ul>
              <div className="action-buttons">
                <button onClick={() => { setAddresses([]); setProcessedResults([]); setLogs([]); }}>Clear</button>
                <button className="primary-btn" onClick={handleProcessAll} disabled={processing}>
                  {processing ? 'Bezig...' : 'LET\'S GO! 🚀'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="panel">
          <h2>2. Results & Downloads</h2>

          {processing && (
            <div className="loading-screen">
              <div className="spinner-container">
                <img src="/utrecht-logo.png" alt="Utrecht" className="spinning-logo" />
              </div>
              <h2 className="motivational-message">{motivationalMessage}</h2>
            </div>
          )}
          {/* Logs Section */}
          <div className="logs-container" style={{ maxHeight: '200px', overflowY: 'auto', background: '#f5f5f5', padding: '10px', marginBottom: '10px', borderRadius: '4px', fontSize: '0.9em' }}>
            {logs.length === 0 && <p style={{ color: '#888' }}>Process logs will appear here...</p>}
            {logs.map((log, i) => (
              <div key={i} style={{
                color: log.type === 'error' ? 'red' : log.type === 'success' ? 'green' : log.type === 'warning' ? 'orange' : 'black',
                marginBottom: '4px'
              }}>
                <span style={{ color: '#999', marginRight: '8px' }}>[{log.timestamp}]</span>
                {log.message}
              </div>
            ))}
          </div>

          {processedResults.length === 0 && !processing && <p>Geen resultaten. Upload Word bestanden en klik op LET'S GO!</p>}

          {processedResults.length > 0 && !processing && (
            <>
              <div className="download-buttons">
                <button onClick={() => generateWordDoc(processedResults)}>📄 Wijkbericht</button>
                <button onClick={() => generateEmailFile(processedResults)}>📧 Redactie mail</button>
              </div>
              <ul className="results-list">
                {processedResults.map((res, i) => (
                  <li key={i}>
                    <strong>{res.originalAddress}</strong> -&gt; {res.address} ({res.district})
                    <br />
                    <a href={res.sourceUrl} target="_blank" rel="noopener noreferrer">View Source</a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
