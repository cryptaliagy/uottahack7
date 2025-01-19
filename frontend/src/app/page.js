"use client";
import { useState } from "react";
import axios from "axios";
import styles from "./page.module.css";

// MUI Data Grid
import { DataGrid } from "@mui/x-data-grid";

const muiColumns = [
  { field: "line_number", headerName: "Line #", width: 80 },
  { field: "username", headerName: "Username", width: 120 },
  { field: "password", headerName: "Password", width: 120 },
  { field: "address", headerName: "Domain", width: 180 },
  { field: "ip_address", headerName: "IP Address", width: 130 },
  { field: "file_name", headerName: "File Name", width: 130 },
  { field: "tags", headerName: "Tags", width: 180 },
  { field: "title", headerName: "Title", width: 120 },
  { field: "scheme", headerName: "Protocol", width: 120 },
  { field: "port", headerName: "Port", width: 80 },
  { field: "url_path", headerName: "URL Path", width: 130 },
  { field: "application", headerName: "Application", width: 130 },
];

export default function Home() {
  const [fileContent, setFileContent] = useState(null);
  const [rows, setRows] = useState([]);
  const [filename, setFilename] = useState("sample.txt");
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  // Optional: Fake loader states (if you still have the 7-second progress bar)
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Multiple fields for query params
  const [offset, setOffset] = useState("");
  const [limit, setLimit] = useState("100");
  const [domain, setDomain] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [path, setPath] = useState("");
  const [tags, setTags] = useState("");
  const [port, setPort] = useState("");
  const [application, setApplication] = useState("");

  const handleBack = () => {
    setFileContent(null);
    setRows([]);
    setFilename("");
    setCount(0);

    // Reset all search fields
    setOffset("");
    setLimit("100");
    setDomain("");
    setIpAddress("");
    setPath("");
    setTags("");
    setPort("");
    setApplication("");
  };

  // -- Example: Upload file handler
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadResponse = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (uploadResponse.status === 200) {
        setFileContent(file.name);
        setFilename(file.name);

        // (Optionally start fake loading here)
        // startFakeLoadingBar();

        // Meanwhile, fetch initial data
        fetchData(file.name);
      }
    } catch (error) {
      console.error("Error uploading or fetching data:", error);
    }
  };

  // -- Example: Data fetch with default limit=100
  const fetchData = async (filename) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/search/${filename}`, {
        params: { limit: 100 },
      });
      if (response.status === 200) {
        setRows(response.data);
        // Get count without filters
        await fetchCount("", {});
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // -- Example: Count fetch
  const fetchCount = async (search, filters) => {
    try {
      let domainUrl = `/api/count/${filename}`;
      if (search !== "") {
        domainUrl += `?${search}`;
      }
      const response = await axios.get(domainUrl, { params: filters });
      if (response.status === 200) {
        setCount(response.data.count);
      }
    } catch (error) {
      console.error("Error fetching count:", error);
    }
  };

  /**
   * Build a query string from all fields. If a field is non-empty, add it.
   * Then pass it to /api/search/[filename].
   */
  const searchData = async () => {
    setLoading(true);

    const queryParams = [];
    if (offset) queryParams.push(`offset=${encodeURIComponent(offset)}`);
    if (limit) queryParams.push(`limit=${encodeURIComponent(limit)}`);
    if (domain) queryParams.push(`domain=${encodeURIComponent(domain)}`);
    if (ipAddress) queryParams.push(`ip_address=${encodeURIComponent(ipAddress)}`);
    if (path) queryParams.push(`path=${encodeURIComponent(path)}`);
    if (tags) queryParams.push(`tags=${encodeURIComponent(tags)}`);
    if (port) queryParams.push(`port=${encodeURIComponent(port)}`);
    if (application) queryParams.push(`application=${encodeURIComponent(application)}`);

    const searchQuery = queryParams.join("&");

    try {
      let url = `/api/search/${filename}`;
      if (searchQuery) {
        url += `?${searchQuery}`;
      }

      const params = {};
      const response = await axios.get(url, { params });
      if (response.status === 200) {
        setRows(response.data);
        await fetchCount(searchQuery, params);
      }
    } catch (error) {
      console.error("Error searching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Example: Simulate button
  const handleSimulateTable = () => {
    setFileContent("Simulated File");
    setFilename("sample.txt");
    // Possibly start fake loading here too...
    fetchData("sample.txt");
  };

  return (
    <div className={styles.page}>
      <div className={styles.background}></div>
      <main className={styles.main}>
        {/* If you have a fake loader, show it while isLoading is true */}
        {isLoading && fileContent ? (
          <div style={{ textAlign: "center" }}>
            <h2>{`Parsing "${filename}"...`}</h2>
            <div className={styles.loadingContainer}>
              <div
                className={styles.loadingBar}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : fileContent ? (
          /* Display table & advanced search form */
          <>
            <div className={styles.topTableRow}>
              <h2 className={styles.parsedTitle}>Parsed Data for {filename}</h2>
              <button onClick={handleBack} className={styles.button}>Back</button>
            </div>

            {/* --- Multi-field search form --- */}
            <div className={styles.searchForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Offset</label>
                  <input
                    className={styles.searchInput}
                    type="number"
                    placeholder="0"
                    value={offset}
                    onChange={(e) => setOffset(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Limit</label>
                  <input
                    className={styles.searchInput}
                    type="number"
                    placeholder="100"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Domain</label>
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="google.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>IP Address</label>
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="192.168.1.1"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Path</label>
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="signin"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tags</label>
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="resolved,active"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Port</label>
                  <input
                    className={styles.searchInput}
                    type="number"
                    placeholder="443"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Application</label>
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="chrome"
                    value={application}
                    onChange={(e) => setApplication(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <button onClick={searchData} className={styles.button}>
                  Search
                </button>
              </div>
            </div>

            {/* Display total results + DataGrid */}
            <div className={styles.topTableRow}>
              <p className={styles.countText}>Total Results: {count}</p>
            </div>
            <div className={styles.tableWrapper}>
              <DataGrid
                rows={rows}
                columns={muiColumns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                checkboxSelection={false}
                sx={{
                  height: 600,
                  overflow: "hidden",
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
                  },
                }}
              />
              {loading && <p>Loading...</p>}
            </div>
          </>
        ) : (
          /* If no file is selected, show your original upload screen */
          <div className={styles.dropzoneArea}>
            <h1 className={styles.title}>DEEP DATA PARSER</h1>
            <div className={styles.uploadCard}>
              <button onClick={handleSimulateTable} className={styles.cardTitle}>
                Upload a text file
              </button>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileSelect}
                className={styles.fileInput}
              />
              <div className={styles.dropzone}>
                Drop your file here or click to upload
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
