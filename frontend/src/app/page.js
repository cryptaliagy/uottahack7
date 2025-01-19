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
  const [searchTerm, setSearchTerm] = useState("");
  const [fileContent, setFileContent] = useState(null);

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

  const handleBack = () => {
    setFileContent(null);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileContent("dummy file content"); // Simulating file parsing
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {fileContent ? (
          <>
            <div className={styles.topTableRow}>
              <h2 className={styles.parsedTitle}>Parsed Data</h2>
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
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                checkboxSelection={false}
                sx={{
                  height: 600, // Grid height
                  overflow: "hidden", // Prevent grid overflow
                  "& .MuiDataGrid-columnHeaders": {
                    position: "sticky",
                    top: 0,
                    zIndex: 3,
                    backgroundColor: "#f2f2f2",
                  },
                  "& .MuiDataGrid-footerContainer": {
                    position: "sticky",
                    bottom: 0,
                    zIndex: 2,
                    backgroundColor: "#f2f2f2",
                    marginTop: 0, // Remove any margin
                    paddingTop: 0, // Remove any padding
                  },
                  "& .MuiDataGrid-virtualScroller": {
                    marginBottom: 0, // Eliminate space between rows and footer
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid #e0e0e0",
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
            <div className={styles.dropzone}>Drop your file here or click to upload</div>
          </div>
        )}
      </main>
    </div>
  );
}
