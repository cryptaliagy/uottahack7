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
  { field: "tags", headerName: "Tags", width: 180 },
];

const placeholderData = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  username: `user${i + 1}`,
  password: `password${i + 1}`,
  address: `${100 + i} Example St`,
  title: i % 2 === 0 ? "Engineer" : "Analyst",
  protocol: i % 3 === 0 ? "https" : "http",
  ip_address: `192.168.${Math.floor(i / 10)}.${i % 255}`,
  port: 8000 + (i % 100),
  url_path: `/api/resource/${i + 1}`,
  domain: `example${i % 10}.com`,
  file_name: `file${i + 1}.txt`,
  line_number: i + 1,
  application: `App${i % 5 + 1}`,
  tags: i % 2 === 0 ? ["tag1", "tag2"] : ["example", "test"],
}));

export default function Home() {
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const handleBack = () => {
    setFileContent("");
    setFileName("");
    setProgress(0);
    setIsLoading(false);
    setSearchTerm("");
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      startFileRead(file);
    }
  };

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

  const filteredRows = placeholderData.filter((row) => {
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
      ...(Array.isArray(row.tags) ? row.tags : []),
    ]
      .join(" ")
      .toLowerCase();
    return rowString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {isLoading ? (
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
          <>
            <div className={styles.topTableRow}>
              <h2 className={styles.parsedTitle}>Data Parsed</h2>
              <button onClick={handleBack} className={styles.button}>
                Back
              </button>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <div className={styles.tableWrapper}>
              <DataGrid
                rows={filteredRows}
                columns={muiColumns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 25]}
                checkboxSelection={false}
                sx={{
                  "& .MuiDataGrid-root": {
                    border: "none",
                  },
                  "& .MuiDataGrid-cell": {
                    color: "#000",
                    backgroundColor: "#fff",
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#f2f2f2",
                  },
                }}
              />
            </div>
          </>
        ) : (
          <div className={styles.uploadCard}>
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
          </div>
        )}
      </main>
    </div>
  );
}
