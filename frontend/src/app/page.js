"use client";
import { useState, useEffect } from "react";
import axios from "axios";
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

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [fileContent, setFileContent] = useState(null);
  const [rows, setRows] = useState([]);
  const [filename, setFilename] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const handleBack = () => {
    setFileContent(null);
    setRows([]);
    setFilename("");
    setOffset(0);
    setHasMore(true);
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        // Upload the file
        const uploadResponse = await axios.post("http://localhost/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (uploadResponse.status === 200) {
          setFileContent(file.name);
          setFilename(file.name);
          fetchData(file.name, 0); // Fetch initial data
        }
      } catch (error) {
        console.error("Error uploading or fetching data:", error);
      }
    }
  };

  const fetchData = async (filename, currentOffset) => {
    if (!hasMore) return; // Stop if no more data to fetch
    setLoading(true);

    try {
      const response = await axios.get(`http://localhost/api/search/${filename}`, {
        params: { offset: currentOffset, limit: 100 },
      });

      if (response.status === 200) {
        const fetchedRows = response.data; // Assume response.data is an array
        setRows((prevRows) => [...prevRows, ...fetchedRows]); // Append new data
        setOffset(currentOffset + 100); // Increment offset
        if (fetchedRows.length < 100) setHasMore(false); // Stop if less than 100 rows
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreData = () => {
    if (hasMore) fetchData(filename, offset);
  };

  const filteredRows = rows.filter((row) => {
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
        {fileContent ? (
          <>
            <div className={styles.topTableRow}>
              <h2 className={styles.parsedTitle}>Parsed Data for {filename}</h2>
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
              {loading && <p>Loading more data...</p>}
              {hasMore && (
                <button onClick={loadMoreData} className={styles.loadMoreButton}>
                  Load More
                </button>
              )}
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
