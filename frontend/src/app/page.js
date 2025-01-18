"use client";
import { useState } from "react";
import styles from "./page.module.css";

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

  /**
   * Reads the file content and simulates a 5-second "parsing" progress.
   */
  const startFileRead = (file) => {
    setIsLoading(true);
    setFileContent("");
    setProgress(0);
    setFileName(file.name);

    // Read file (asynchronously), but don't show content until progress completes
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target.result);
    };
    reader.readAsText(file);

    // Simulate a 5-second progress, increment 1% every 50ms
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
          We have 3 distinct states:
            1) Loading? => Show progress
            2) Not loading but have file content? => Show "Data Parsed"
            3) Otherwise => Show the upload UI
        */}
        {isLoading ? (
          // --- LOADING STATE ---
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <p>Parsing data of "{fileName}"</p>
            <div className={styles.loadingContainer}>
              <div
                className={styles.loadingBar}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : fileContent ? (
          // --- PARSED STATE ---
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <h2>Data Parsed</h2>
            <button onClick={handleBack} style={{ marginBottom: "1rem" }}>
              Back
            </button>
          </div>
        ) : (
          // --- INITIAL / UPLOAD STATE ---
          <>
            <h1>Upload a Text File</h1>
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
