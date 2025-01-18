"use client";
import { useState } from "react";
import styles from "./page.module.css";

// Example column names
const columns = [
  "id",
  "username",
  "password",
  "address",
  "title",
  "protocol",
  "ip_address",
  "port",
  "url_path",
  "domain",
  "file_name",
  "line_number",
  "application",
  "tags"
];

// Example placeholder row
const placeholderData = [
  {
    id: 1,
    username: "jdoe",
    password: "abc123",
    address: "123 Example St",
    title: "My Title",
    protocol: "https",
    ip_address: "127.0.0.1",
    port: 8080,
    url_path: "/api/example",
    domain: "example.com",
    file_name: "notes.txt",
    line_number: 42,
    application: "MyApp",
    tags: ["placeholder", "data"]
  }
];

export default function Home() {
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Resets state to initial
  const handleBack = () => {
    setFileContent("");
    setFileName("");
    setProgress(0);
    setIsLoading(false);
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      startFileRead(file);
    }
  };

  // Handle drag events
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  // Handle dropped file
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      startFileRead(file);
    }
  };

  /**
   * Reads the file content and simulates a 5-second "parsing" progress.
   */
  const startFileRead = (file) => {
    setIsLoading(true);
    setFileContent("");
    setProgress(0);
    setFileName(file.name);

    // Read file asynchronously; content is stored but not displayed until done
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target.result);
    };
    reader.readAsText(file);

    // Simulate a 5-second progress (increment 1% every 50ms)
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 50);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/*
          We have 3 states:
            1) Loading -> Show the progress bar
            2) File parsed -> Show "Data Parsed" + Back button + placeholder table
            3) Otherwise -> Show the upload UI
        */}
        {isLoading ? (
          // --- LOADING STATE ---
          <div>
            <p className={styles.loadingText}>
              Parsing data of "{fileName}"
            </p>
            <div className={styles.loadingContainer}>
              <div
                className={styles.loadingBar}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : fileContent ? (
          // --- PARSED STATE ---
          <div className={styles.parsedSection}>
            <div className={styles.topTableRow}>
              <div className={styles.parsedTitle}>Data Parsed</div>
              <button onClick={handleBack} className={styles.button}>
                Back
              </button>
            </div>


            {/* 
              Render a placeholder table of data 
              (we'll eventually replace placeholderData with real data 
              from the fileContent or an API).
            */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {placeholderData.map((row, i) => (
                    <tr key={i}>
                      {columns.map((col) => (
                        <td key={col}>
                          {/* Display the row value if present, otherwise fallback to "" */}
                          {row[col] !== undefined ? String(row[col]) : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // --- INITIAL / UPLOAD STATE ---
          <>
            {/* Use a local style for your "Upload a Text File" heading */}
            <h1 className={styles.uploadTitle}>Upload a Text File</h1>

            <input
              type="file"
              accept=".txt"
              onChange={handleFileSelect}
              className={styles.fileInput}
            />

            <div
              className={`${styles.dropzone} ${isDragging ? styles.dragActive : ""
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragging ? "Drop it here!" : "Or drag and drop a file here"}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
