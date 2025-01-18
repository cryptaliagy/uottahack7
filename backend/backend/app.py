from fastapi import FastAPI

app = FastAPI(root_path="/api")

@app.get("/health")
def health():
    return {"status": "ok"}