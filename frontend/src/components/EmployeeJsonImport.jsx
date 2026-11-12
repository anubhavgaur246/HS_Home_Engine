import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileJson2, Upload, X } from 'lucide-react';

const TEMPLATE_JSON = JSON.stringify([
  {
    firstName: 'First name',
    lastName: 'Last name',
    highspringEmail: 'person@highspring.com',
    email: 'person@example.com',
    ldap: 'person.ldap',
    role: 'USER',
  },
], null, 2);

export function EmployeeJsonImport({ user }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [result, setResult] = useState(null);

  const clearImport = () => {
    setFile(null);
    setMessage('');
    setError(false);
    setResult(null);
  };

  const submitImport = async (event) => {
    event.preventDefault();
    if (!file) {
      setError(true);
      setMessage('Select an employee JSON file first.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError(false);
    setResult(null);

    try {
      const payload = JSON.parse(await file.text());
      const employees = Array.isArray(payload) ? payload : payload?.data;
      if (!Array.isArray(employees) || employees.length === 0) {
        throw new Error('The JSON must contain a non-empty array of employees, or an object with a data array.');
      }

      const response = await fetch('/api/data-upload/employees/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseBody.detail || responseBody.error || responseBody.message || 'Employee import failed.');
      }

      setResult(responseBody.data);
      setMessage(responseBody.message || 'Employee data imported successfully.');
      setError(false);
    } catch (importError) {
      setMessage(importError instanceof SyntaxError ? 'The selected file is not valid JSON.' : importError.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="data-upload-section" aria-labelledby="employee-import-title">
      <div className="data-upload-heading">
        <div>
          <span className="data-upload-eyebrow">SUPER ADMIN</span>
          <h2 id="employee-import-title">Import employee data</h2>
          <p>Upload a JSON employee list to add accounts to the database. Existing email addresses are skipped.</p>
        </div>
        <span className="data-upload-icon"><FileJson2 size={22} /></span>
      </div>

      <form onSubmit={submitImport}>
        <div className="upload-file-grid">
          <div className="upload-file-control">
            <input
              id="employee-json-file"
              type="file"
              accept=".json,application/json"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setMessage('');
                setResult(null);
                setError(false);
              }}
            />
            <label className="upload-file-label" htmlFor="employee-json-file">
              <span className="upload-file-icon"><FileJson2 size={19} /></span>
              <span className="upload-file-copy">
                <strong>Employee JSON file</strong>
                <small>{file?.name || 'Choose a .json file to import'}</small>
              </span>
              <span className="upload-choose-button">Choose file</span>
            </label>
          </div>
          <a
            className="upload-file-label upload-template-link"
            href={`data:application/json;charset=utf-8,${encodeURIComponent(TEMPLATE_JSON)}`}
            download="employee-import-template.json"
          >
            <span className="upload-file-icon template"><Download size={19} /></span>
            <span className="upload-file-copy">
              <strong>Import template</strong>
              <small>Download the supported JSON format</small>
            </span>
            <span className="upload-choose-button">Download</span>
          </a>
        </div>

        <div className="upload-form-footer">
          <div>
            {message && (
              <p className={`upload-status ${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'}>
                {error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <span>{message}</span>
              </p>
            )}
            {result && (
              <p className="upload-status upload-result-counts">
                Created: {result.created} · Skipped: {result.skipped} · Missing Highspring email: {result.skipped_missing_email}
              </p>
            )}
          </div>
          <div className="upload-form-actions">
            <button type="button" className="upload-clear-button" onClick={clearImport} disabled={loading}>
              <X size={15} />Clear
            </button>
            <button type="submit" className="upload-submit-button" disabled={loading || !file}>
              {loading ? <span className="upload-spinner" /> : <Upload size={16} />}
              {loading ? 'Importing...' : 'Import JSON'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}