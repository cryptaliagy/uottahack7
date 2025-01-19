"use client";
import { useState } from "react";
import axios from "axios";
import styles from "./page.module.css";

// MUI Data Grid
import { DataGrid } from "@mui/x-data-grid";

// MUI columns
const muiColumns = [
  // { field: "id", headerName: "ID", width: 70 },
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
  // { field: "domain", headerName: "Domain", width: 130 },
  { field: "application", headerName: "Application", width: 130 },

];

export default function Home() {
  const [fileContent, setFileContent] = useState(null);
  const [rows, setRows] = useState([]);
  const [filename, setFilename] = useState("sample.txt"); // Default filename for simulation
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [count, setCount] = useState(0); // Count of matching queries

  const handleBack = () => {
    setFileContent(null);
    setRows([]);
    setFilename("");
    setCount(0); // Reset count
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        // Upload the file
        const uploadResponse = await axios.post("/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (uploadResponse.status === 200) {
          setFileContent(file.name);
          setFilename(file.name);
          fetchData(file.name); // Fetch initial data
        }
      } catch (error) {
        console.error("Error uploading or fetching data:", error);
      }
    }
  };

  const fetchData = async (filename) => {
    setLoading(true);

    try {
      const response = await axios.get(`/api/search/${filename}`, {
        params: { limit: 100 },
      });

      if (response.status === 200) {
        setRows(response.data); // Update rows with fetched data
        await fetchCount("", {}); // Fetch count without filters
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCount = async (search, filters) => {
    try {
      // Make an API call to get the count of queries
      let domain = `/api/count/${filename}`;

      if (search !== "") {
        domain = `/api/count/${filename}?${search}`;
      }

      const response = await axios.get(domain, {
        params: filters,
      });

      if (response.status === 200) {
        setCount(response.data.count); // Update count
      }
    } catch (error) {
      console.error("Error fetching count:", error);
    }
  };

  const searchData = async () => {
    setLoading(true);
    try {
      // Dynamically construct query parameters
      const params = {
        offset: 0,
        limit: 100,
      };

      let domain = `/api/search/${filename}`;

      if (searchKeyword !== "") {
        domain = `/api/search/${filename}?${searchKeyword}`;
      }

      const response = await axios.get(domain, { params });

      if (response.status === 200) {
        setRows(response.data); // Update rows with filtered data
        await fetchCount(searchKeyword, params); // Fetch count with filters
      } else {
        console.error("Unexpected response:", response);
      }
    } catch (error) {
      console.error("Error searching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateTable = () => {
    setFileContent("Simulated File");
    fetchData(filename); // Simulate fetching data for the default file
  };

  return (
    <div className={styles.page}>
      <div className={styles.background}></div>
      <main className={styles.main}>
        {fileContent ? (
          <>
            <div className={styles.topTableRow}>
              <h2 className={styles.parsedTitle}>Parsed Data for {filename}</h2>
              <button onClick={handleBack} className={styles.button}>
                Back
              </button>
            </div>
            <div className={styles.topTableRow}>
              <input
                type="text"
                placeholder="Search across all fields..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className={styles.searchInput}
              />
              <button onClick={searchData} className={styles.button}>
                Search
              </button>
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
                  },
                }}
              />
              {loading && <p>Loading...</p>}
            </div>
          </>
        ) : (
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
              <div className={styles.dropzone}>Drop your file here or click to upload</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
