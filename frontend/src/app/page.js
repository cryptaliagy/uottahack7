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
  const [filename, setFilename] = useState("sample.txt");
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);

  // Loading states
  const [loading, setLoading] = useState(false); // For server requests
  const [isLoading, setIsLoading] = useState(false); // For the 7-second “fake” parse
  const [progress, setProgress] = useState(0);

  // Multi-field search states
  const [offset, setOffset] = useState("");
  const [limit, setLimit] = useState("100");
  const [domain, setDomain] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [path, setPath] = useState("");
  const [tags, setTags] = useState("");
  const [port, setPort] = useState("");
  const [application, setApplication] = useState("");

  // Resets everything
  const handleBack = () => {
    setFileContent(null);
    setFilename("");
    setRows([]);
    setCount(0);

    // Reset search form fields
    setOffset("");
    setLimit("100");
    setDomain("");
    setIpAddress("");
    setPath("");
    setTags("");
    setPort("");
    setApplication("");
  };

  /**
   * Starts the 7-second loading bar animation,
   * finishing at 100% after ~7s.
   */
  const startFakeLoadingBar = () => {
    setIsLoading(true);
    setProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setProgress(current);
      // Clear once we hit 100%
      if (current >= 100) {
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 70); // 70 ms * 100 = 7000 ms (7 seconds total)
  };

  /**
   * Upload handler
   */
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Start the fake progress bar
      startFakeLoadingBar();

      // Meanwhile, do the actual upload
      const uploadResponse = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadResponse.status === 200) {
        setFileContent(file.name);
        setFilename(file.name);
        fetchData(file.name); // fetch initial data
      }
    } catch (error) {
      console.error("Error uploading or fetching data:", error);
      setIsLoading(false); // stop the fake loader if error
    }
  };

  /**
   * Fetch Data from your API (limit=100 by default)
   */
  const fetchData = async (file) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/search/${file}`, {
        params: { limit: 100 },
      });
      if (response.status === 200) {
        setRows(response.data);
        // fetch count with no filters
        await fetchCount("", {});
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch Count to show total results
   */
  const fetchCount = async (search, filters) => {
    try {
      let url = `/api/count/${filename}`;
      if (search) {
        url += `?${search}`;
      }
      const resp = await axios.get(url, { params: filters });
      if (resp.status === 200) {
        setCount(resp.data.count);
      }
    } catch (error) {
      console.error("Error fetching count:", error);
    }
  };

  /**
   * Build query from all fields, then do a GET to /api/search/[filename]
   */
  const searchData = async () => {
    setLoading(true);
    try {
      // Build query
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

      let url = `/api/search/${filename}`;
      if (searchQuery) {
        url += `?${searchQuery}`;
      }

      const response = await axios.get(url);
      if (response.status === 200) {
        setRows(response.data);
        await fetchCount(searchQuery, {});
      }
    } catch (error) {
      console.error("Error searching data:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Simulate table with a default "sample.txt"
   * Also triggers the 7-second fake loader
   */
  const handleSimulateTable = () => {
    setFileContent("Simulated File");
    setFilename("sample.txt");

    // Start the fake loading bar
    startFakeLoadingBar();
    // Then fetch data
    fetchData("sample.txt");
  };

  return (
    <div className={styles.page}>
      <div className={styles.background}></div>
      <main className={styles.main}>
        {/* If the 7-second fake parse is happening, show progress bar */}
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
          // Once file is set and fake loading done, show the search form + table
          <>
            <div className={styles.topTableRow}>
              <h2 className={styles.parsedTitle}>Parsed Data for {filename}</h2>
              <button onClick={handleBack} className={styles.button}>Back</button>
            </div>

            {/* Multi-field search form */}
            <div className={styles.searchForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Offset</label>
                  <input
                    type="number"
                    className={styles.searchInput}
                    placeholder="0"
                    value={offset}
                    onChange={(e) => setOffset(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Limit</label>
                  <input
                    type="number"
                    className={styles.searchInput}
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
                    type="text"
                    className={styles.searchInput}
                    placeholder="google.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>IP Address</label>
                  <input
                    type="text"
                    className={styles.searchInput}
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
                    type="text"
                    className={styles.searchInput}
                    placeholder="signin"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tags</label>
                  <input
                    type="text"
                    className={styles.searchInput}
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
                    type="number"
                    className={styles.searchInput}
                    placeholder="443"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Application</label>
                  <input
                    type="text"
                    className={styles.searchInput}
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
          // No file yet => show upload/simulate screen
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

