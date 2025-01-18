"use client";
import { useState } from "react";
import styles from "./page.module.css";

// MUI Data Grid
import { DataGrid } from "@mui/x-data-grid";

// MUI columns
const muiColumns = [
  { field: "id", headerName: "ID", width: 70 },
  { field: "username", headerName: "Username", width: 120 },
  { field: "password", headerName: "Password", width: 120 },
  { field: "address", headerName: "Address", width: 180 },
  { field: "title", headerName: "Title", width: 120 },
  { field: "protocol", headerName: "Protocol", width: 120 },
  { field: "ip_address", headerName: "IP Address", width: 130 },
  { field: "port", headerName: "Port", width: 80 },
  { field: "url_path", headerName: "URL Path", width: 130 },
  { field: "domain", headerName: "Domain", width: 130 },
  { field: "file_name", headerName: "File Name", width: 130 },
  { field: "line_number", headerName: "Line #", width: 80 },
  { field: "application", headerName: "Application", width: 130 },
  { field: "tags", headerName: "Tags", width: 180 }
];

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
  },
  {
    id: 2,
    username: "jsmith",
    password: "pass123",
    address: "456 Some Road",
    title: "Engineer",
    protocol: "http",
    ip_address: "192.168.1.10",
    port: 3000,
    url_path: "/home",
    domain: "somewhere.org",
    file_name: "server.log",
    line_number: 13,
    application: "MyOtherApp",
    tags: ["example", "test"]
  },
  {
    id: 3,
    username: "mjohnson",
    password: "mdj999",
    address: "789 Avenue Blvd",
    title: "Manager",
    protocol: "ftp",
    ip_address: "10.0.0.2",
    port: 21,
    url_path: "/downloads",
    domain: "ftp.example.net",
    file_name: "data.txt",
    line_number: 7,
    application: "FileTransfer",
    tags: ["sample", "ftp"]
  },
  {
    id: 4,
    username: "abrown",
    password: "brownie",
    address: "22 Oak Street",
    title: "Developer",
    protocol: "https",
    ip_address: "192.168.50.5",
    port: 5001,
    url_path: "/api/v2",
    domain: "dev.local",
    file_name: "main.py",
    line_number: 100,
    application: "CodeRunner",
    tags: ["dev", "backend"]
  },
  {
    id: 5,
    username: "cdavis",
    password: "cpass45",
    address: "99 Redwood Ln",
    title: "QA",
    protocol: "http",
    ip_address: "172.16.0.101",
    port: 8081,
    url_path: "/test",
    domain: "qa.local",
    file_name: "test_results.csv",
    line_number: 256,
    application: "TestSuite",
    tags: ["test", "automation"]
  },
  {
    id: 6,
    username: "swilson",
    password: "sw123",
    address: "400 Pine Rd",
    title: "Analyst",
    protocol: "https",
    ip_address: "8.8.8.8",
    port: 8080,
    url_path: "/reports",
    domain: "analytics.example",
    file_name: "report.xlsx",
    line_number: 12,
    application: "AnalyticsApp",
    tags: ["analysis", "data"]
  }
];

export default function Home() {
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // NEW: State for searchTerm
  const [searchTerm, setSearchTerm] = useState("");

  // Handler to reset everything
  const handleBack = () => {
    setFileContent("");
    setFileName("");
    setProgress(0);
    setIsLoading(false);
    setSearchTerm(""); // clear search bar
  };

  // File selection
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      startFileRead(file);
    }
  };

  // Drag events
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      startFileRead(file);
    }
  };

  /**
   * Simulate reading & 5-second "parsing" progress
   */
  const startFileRead = (file) => {
    setIsLoading(true);
    setFileContent("");
    setProgress(0);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target.result);
    };
    reader.readAsText(file);

    // Simulate 5 seconds progress
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

  // NEW: Filter rows by searchTerm (global match in any field)
  const filteredRows = placeholderData.filter((row) => {
    // Convert everything to a single string
    // We'll also handle arrays like `tags` by joining them
    const rowString = [
      row.id,
      row.username,
      row.password,
      row.address,
      row.title,
      row.protocol,
      row.ip_address,
      row.port,
      row.url_path,
      row.domain,
      row.file_name,
      row.line_number,
      row.application,
      ...(Array.isArray(row.tags) ? row.tags : [])
    ]
      .join(" ")
      .toLowerCase();

    // Check if searchTerm is included
    return rowString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {isLoading ? (
          // --- LOADING STATE ---
          <div>
            <p className={styles.loadingText}>Parsing data of "{fileName}"</p>
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
              1) Add an input to capture searchTerm
              2) Filter rows before passing them to DataGrid
            */}

            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput} // apply the new class
            />


            {/* MUI Data Grid Section */}
            <div style={{ width: "80vw", height: 400, margin: "1rem auto" }}>
              <DataGrid
                rows={filteredRows}    // pass filteredRows instead of placeholderData
                columns={muiColumns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 25]}
                checkboxSelection={false}
              />
            </div>
          </div>
        ) : (
          // --- INITIAL / UPLOAD STATE ---
          <>
            <h1 className={styles.uploadTitle}>Upload a Text File</h1>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileSelect}
              className={styles.fileInput}
            />
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dragActive : ""}`}
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
