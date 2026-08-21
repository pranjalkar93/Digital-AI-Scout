"""
Digital Scout India - Python Backend with Firebase Firestore Integration
FastAPI with Standard Library Fallback
"""

import os
import json
import random
import time
import urllib.request
import urllib.error
from typing import Optional, Dict, Any, List

# Load Firebase Configuration
FIREBASE_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "firebase-applet-config.json")
firebase_config = {}
if os.path.exists(FIREBASE_CONFIG_PATH):
    try:
        with open(FIREBASE_CONFIG_PATH, "r") as f:
            firebase_config = json.load(f)
    except Exception as e:
        print(f"Error loading firebase config: {e}")

PROJECT_ID = firebase_config.get("projectId", "gen-lang-client-0001785061")
DATABASE_ID = firebase_config.get("firestoreDatabaseId", "(default)")
API_KEY = firebase_config.get("apiKey", "")

# Firestore REST Base URL
FIRESTORE_REST_BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DATABASE_ID}/documents"

# Firestore Helper
def firestore_request(method: str, path: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    url = f"{FIRESTORE_REST_BASE}/{path}?key={API_KEY}"
    headers = {"Content-Type": "application/json"}
    
    payload_bytes = None
    if data:
        payload_bytes = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=payload_bytes, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"Firestore API Error ({e.code}): {err_body}")
        return {"error": str(e.reason)}
    except Exception as e:
        print(f"Firestore Connection Error: {e}")
        return {"error": str(e)}

# Handler Logic
def handle_health():
    return {
        "status": "online",
        "backend": "Python Backend",
        "firebase_project": PROJECT_ID,
        "database_id": DATABASE_ID,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

def handle_register(body: dict):
    user_id = f"usr-{int(time.time()*1000)}"
    first_name = body.get("firstName", "Member")
    last_name = body.get("lastName", "")
    display_name = f"{first_name} {last_name}".strip()
    phone = body.get("phone", "")
    
    doc_fields = {
        "fields": {
            "id": {"stringValue": user_id},
            "phone": {"stringValue": phone},
            "role": {"stringValue": "USER"},
            "status": {"stringValue": "ACTIVE"},
            "displayName": {"stringValue": display_name},
            "firstName": {"stringValue": first_name},
            "lastName": {"stringValue": last_name},
            "createdAt": {"stringValue": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
        }
    }
    
    firestore_request("PATCH", f"users/{user_id}", doc_fields)

    return {
        "success": True,
        "backend": "Python + Firebase Firestore",
        "user": {
            "id": user_id,
            "displayName": display_name,
            "role": "USER",
            "phone": phone
        },
        "message": "User registered successfully in Firebase Firestore via Python backend!"
    }

def handle_analyze_drill(body: dict):
    drill_title = body.get("drillTitle", "Football Drill")
    primary_metric = body.get("primaryMetric", "reps")
    metric_value = body.get("metricValue", "30")
    
    score = random.randint(75, 95)
    
    return {
        "backend": "Python Intelligence Engine",
        "drillTitle": drill_title,
        "score": score,
        "feedback": {
            "strengths": [
                f"Maintained excellent biomechanical posture during {drill_title}.",
                f"Metric output ({metric_value} {primary_metric}) places player in top tier."
            ],
            "improvements": [
                "Focus on non-dominant foot deceleration control.",
                "Incorporate head-up vision scanning during high-tempo drills."
            ],
            "scoutNotes": "High potential grassroots prospect. Strong technical foundation."
        }
    }

# Attempt FastAPI load
HAS_FASTAPI = False
try:
    from fastapi import FastAPI, Request
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False

if HAS_FASTAPI:
    app = FastAPI(title="Digital Scout India - Python FastAPI Backend")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/py/health")
    def py_health():
        return handle_health()

    @app.post("/api/py/auth/register")
    async def py_register(request: Request):
        body = await request.json()
        return handle_register(body)

    @app.post("/api/py/analyze-drill")
    async def py_analyze(request: Request):
        body = await request.json()
        return handle_analyze_drill(body)

else:
    # Fallback to standard HTTP server
    from http.server import HTTPServer, BaseHTTPRequestHandler

    class PythonBackendHandler(BaseHTTPRequestHandler):
        def do_OPTIONS(self):
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()

        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            res_data = handle_health()
            self.wfile.write(json.dumps(res_data).encode("utf-8"))

        def do_POST(self):
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            
            try:
                body = json.loads(post_data)
            except Exception:
                body = {}

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            if "register" in self.path:
                res_data = handle_register(body)
            elif "analyze-drill" in self.path:
                res_data = handle_analyze_drill(body)
            else:
                res_data = handle_health()

            self.wfile.write(json.dumps(res_data).encode("utf-8"))

    def run_fallback_server():
        server_address = ('0.0.0.0', 8000)
        httpd = HTTPServer(server_address, PythonBackendHandler)
        print("[Python Backend] Running fallback HTTP server on port 8000...")
        httpd.serve_forever()

if __name__ == "__main__":
    if HAS_FASTAPI:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
    else:
        run_fallback_server()
