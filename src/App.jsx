import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Download, FileJson2, FileSpreadsheet, Upload, X } from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ToolGrid } from './components/ToolGrid';
import { Footer } from './components/Footer';
import { HubAssistant } from './components/HubAssistant';
import { TOOLS } from './config/tools';

export function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('highspring-theme') || 'dark';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [jsonFile, setJsonFile] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [uploadState, setUploadState] = useState('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const jsonInputRef = useRef(null);
  const templateInputRef = useRef(null);

  // Sync theme attribute with document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('highspring-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const submitEmployeeFiles = async (event) => {
    event.preventDefault();
    if (!jsonFile || !templateFile) {
      setUploadState('error');
      setUploadMessage('Select both the employee JSON and Excel template before submitting.');
      return;
    }

    const formData = new FormData();
    formData.append('json_file', jsonFile);
    formData.append('template_file', templateFile);
    setUploadState('loading');
    setUploadMessage('Preparing your Excel file…');

    try {
      const response = await fetch('/api/data-upload/employees/export', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail || 'The files could not be processed. Check the inputs and try again.');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const outputExtension = templateFile.name.toLowerCase().endsWith('.ods') ? 'ods' : 'xlsx';
      link.download = `employees_export.${outputExtension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setUploadState('success');
      setUploadMessage('Your Excel file is ready and has been downloaded.');
    } catch (error) {
      setUploadState('error');
      setUploadMessage(error.message || 'Unable to connect to the data upload API.');
    }
  };

  const clearSelectedFiles = () => {
    setJsonFile(null);
    setTemplateFile(null);
    setUploadState('idle');
    setUploadMessage('');
    if (jsonInputRef.current) jsonInputRef.current.value = '';
    if (templateInputRef.current) templateInputRef.current.value = '';
  };

  return (
    <div className="app-canvas">
      {/* Simple, Elegant, Executive Background */}
      <div className="ambient-backdrop-refined" aria-hidden="true">
        <div className="subtle-precision-grid" />
        <div className="ambient-top-glow" />
        <div className="ambient-bottom-glow" />
      </div>

      {/* Navigation Header */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content */}
      <main id="main-content" className="main-content-flow">
        <Hero />

        <section className="data-upload-section container" aria-labelledby="data-upload-title">
          <div className="data-upload-heading">
            <div>
              <span className="data-upload-eyebrow">EMPLOYEE DATA</span>
              <h2 id="data-upload-title">Build your Excel file</h2>
              <p>Upload the employee JSON and your workbook template. We’ll map the records and return a completed Excel file.</p>
            </div>
            <div className="data-upload-icon" aria-hidden="true"><FileSpreadsheet size={23} /></div>
          </div>

          <form className="data-upload-form" onSubmit={submitEmployeeFiles}>
            <div className="upload-file-grid">
              <div className="upload-file-control">
                <input
                  ref={jsonInputRef}
                  id="employee-json-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={(event) => { setJsonFile(event.target.files?.[0] || null); setUploadState('idle'); setUploadMessage(''); }}
                />
                <label className="upload-file-label" htmlFor="employee-json-file">
                  <span className="upload-file-icon"><FileJson2 size={19} /></span>
                  <span className="upload-file-copy">
                    <strong>Employee JSON</strong>
                    <small>{jsonFile ? jsonFile.name : 'Choose a .json file'}</small>
                  </span>
                  <span className="upload-choose-button">Upload</span>
                </label>
              </div>
              <div className="upload-file-control">
                <input
                  ref={templateInputRef}
                  id="employee-template-file"
                  type="file"
                  accept=".xlsx,.xslx,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet"
                  onChange={(event) => { setTemplateFile(event.target.files?.[0] || null); setUploadState('idle'); setUploadMessage(''); }}
                />
                <label className="upload-file-label" htmlFor="employee-template-file">
                  <span className="upload-file-icon template"><FileSpreadsheet size={19} /></span>
                  <span className="upload-file-copy">
                    <strong>Excel template</strong>
                    <small>{templateFile ? templateFile.name : 'Choose a .xlsx or .ods file'}</small>
                  </span>
                  <span className="upload-choose-button">Upload</span>
                </label>
              </div>
            </div>

            <div className="upload-form-footer">
              <div className={`upload-status ${uploadState}`} role="status" aria-live="polite">
                {uploadMessage && <>
                  {uploadState === 'error' && <AlertCircle size={16} />}
                  {uploadState === 'success' && <CheckCircle2 size={16} />}
                  <span>{uploadMessage}</span>
                </>}
              </div>
              <div className="upload-form-actions">
                {(jsonFile || templateFile) && <button type="button" className="upload-clear-button" onClick={clearSelectedFiles}><X size={15} /> Clear</button>}
                <button type="submit" className="upload-submit-button" disabled={uploadState === 'loading'}>
                  {uploadState === 'loading' ? <><span className="upload-spinner" /> Processing</> : <><Download size={16} /> Submit and download</>}
                </button>
              </div>
            </div>
          </form>
        </section>

        <ToolGrid
          tools={TOOLS}
          searchQuery={searchQuery}
          onResetSearch={() => setSearchQuery('')}
        />
      </main>

      {/* Enterprise Footer */}
      <Footer />

      {/* Interactive Highspring Assistant & User Manuals Bot */}
      <HubAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onOpen={() => setIsAssistantOpen(true)}
      />
    </div>
  );
}

export default App;
