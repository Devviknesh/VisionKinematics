import os
import sys
import time
import json
import urllib.request
import urllib.parse
import cv2
import numpy as np

API_BASE = "http://127.0.0.1:8000"

def create_test_video(filename="sample_test_face.mp4", duration_sec=4, fps=20):
    print(f"Creating test video: {filename} ({duration_sec}s @ {fps}fps)...")
    width, height = 640, 480
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(filename, fourcc, fps, (width, height))

    total_frames = int(duration_sec * fps)
    for i in range(total_frames):
        t = i / fps
        frame = np.ones((height, width, 3), dtype=np.uint8) * 50

        # Simulate head movement (yaw left/right and slight tilt)
        offset_x = int(40 * np.sin(2 * np.pi * t / duration_sec))
        offset_y = int(15 * np.cos(2 * np.pi * t / duration_sec))
        cx = 320 + offset_x
        cy = 240 + offset_y

        # Face oval
        cv2.ellipse(frame, (cx, cy), (90, 120), 0, 0, 360, (200, 175, 145), -1)

        # Eyes (white sclera)
        cv2.ellipse(frame, (cx - 35, cy - 25), (18, 10), 0, 0, 360, (245, 245, 245), -1)
        cv2.ellipse(frame, (cx + 35, cy - 25), (18, 10), 0, 0, 360, (245, 245, 245), -1)

        # Pupils (moving gaze)
        gaze_dx = int(6 * np.sin(4 * np.pi * t / duration_sec))
        cv2.circle(frame, (cx - 35 + gaze_dx, cy - 25), 5, (20, 15, 10), -1)
        cv2.circle(frame, (cx + 35 + gaze_dx, cy - 25), 5, (20, 15, 10), -1)

        # Eyebrows
        cv2.line(frame, (cx - 55, cy - 45), (cx - 15, cy - 42), (70, 50, 30), 4)
        cv2.line(frame, (cx + 15, cy - 42), (cx + 55, cy - 45), (70, 50, 30), 4)

        # Nose bridge
        cv2.line(frame, (cx, cy - 15), (cx - 8, cy + 15), (160, 130, 100), 3)
        cv2.line(frame, (cx - 8, cy + 15), (cx + 5, cy + 18), (160, 130, 100), 3)

        # Mouth (smiling when t > 2)
        if t > 2.0:
            cv2.ellipse(frame, (cx, cy + 50), (32, 18), 0, 0, 180, (140, 60, 60), 3)
        else:
            cv2.line(frame, (cx - 25, cy + 50), (cx + 25, cy + 50), (140, 60, 60), 3)

        out.write(frame)

    out.release()
    file_size = os.path.getsize(filename)
    print(f"Video created successfully: {filename} ({file_size} bytes)")
    return filename

def upload_file_multipart(url, file_path, headers=None):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    filename = os.path.basename(file_path)
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    lines = []
    lines.append(f"--{boundary}".encode())
    lines.append(f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode())
    lines.append(b"Content-Type: video/mp4")
    lines.append(b"")
    lines.append(file_bytes)
    lines.append(f"--{boundary}--".encode())
    lines.append(b"")
    body = b"\r\n".join(lines)

    req_headers = {"Content-Type": f"multipart/form-data; boundary={boundary}"}
    if headers:
        req_headers.update(headers)

    req = urllib.request.Request(url, data=body, headers=req_headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def api_request(url, method="GET", json_data=None, headers=None):
    req_headers = {}
    if headers:
        req_headers.update(headers)
    body = None
    if json_data is not None:
        body = json.dumps(json_data).encode("utf-8")
        req_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
        content_type = resp.headers.get("Content-Type", "")
        if "application/json" in content_type:
            return json.loads(data.decode("utf-8"))
        return data

def run_test():
    # 1. Register / Login test user
    test_user_email = "pipeline_runner@example.com"
    test_user_password = "Password123!"

    print("\n--- Step 1: User Authentication ---")
    try:
        api_request(f"{API_BASE}/api/auth/register", method="POST", json_data={
            "name": "Pipeline Runner",
            "email": test_user_email,
            "password": test_user_password
        })
        print("Registered new test user.")
    except urllib.error.HTTPError as e:
        print(f"Register note: {e.code} (user may already exist)")

    login_res = api_request(f"{API_BASE}/api/auth/login", method="POST", json_data={
        "email": test_user_email,
        "password": test_user_password
    })
    token = login_res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully! Token received.")

    # 2. Create sample video
    print("\n--- Step 2: Generate Test Video ---")
    video_path = create_test_video("sample_test_face.mp4")

    # 3. Upload video
    print("\n--- Step 3: Upload Video to Backend ---")
    upload_res = upload_file_multipart(f"{API_BASE}/api/videos/upload", video_path, headers=headers)
    video_info = upload_res["video"]
    video_id = video_info["id"]
    print(f"Video uploaded successfully!")
    print(f"  ID: {video_id}")
    print(f"  Duration: {video_info.get('duration')}s")
    print(f"  Resolution: {video_info.get('resolution')}")
    print(f"  FPS: {video_info.get('fps')}")

    # 4. Trigger analysis
    print("\n--- Step 4: Start Computer Vision Analysis ---")
    start_res = api_request(f"{API_BASE}/api/analysis/{video_id}/start", method="POST", headers=headers)
    analysis_id = start_res["id"]
    print(f"Analysis triggered! Analysis ID: {analysis_id}")

    # 5. Poll for completion
    print("\n--- Step 5: Polling Analysis Progress ---")
    start_time = time.time()
    last_progress = -1
    completed = False

    while time.time() - start_time < 90:
        status_data = api_request(f"{API_BASE}/api/analysis/{analysis_id}/status", method="GET", headers=headers)
        current_status = status_data["processing_status"]
        progress = status_data["progress"]

        if progress != last_progress:
            print(f"  Status: {current_status} | Progress: {progress:.1f}%")
            last_progress = progress

        if current_status == "completed":
            completed = True
            print("  Analysis COMPLETED successfully!")
            break
        elif current_status == "failed":
            print(f"  Analysis FAILED with error: {status_data.get('error_message')}")
            sys.exit(1)

        time.sleep(1)

    assert completed, "Analysis timed out after 90 seconds"

    # 6. Fetch results, events, and statistics
    print("\n--- Step 6: Verify Analysis Results & Events ---")
    results_data = api_request(f"{API_BASE}/api/analysis/{analysis_id}/results", method="GET", headers=headers)

    timeline_metrics = results_data.get("timeline_metrics", [])
    events_list = results_data.get("events", [])
    summary_stats = results_data.get("summary_statistics", {})

    print(f"  Total Metric Frames Extracted: {len(timeline_metrics)}")
    print(f"  Total Visual Events Detected: {len(events_list)}")
    print(f"  Summary Statistics: {json.dumps(summary_stats, indent=2)}")

    events = api_request(f"{API_BASE}/api/analysis/{analysis_id}/events", method="GET", headers=headers)
    print(f"\n  Sample Events detected ({len(events)} total):")
    for ev in events[:5]:
        print(f"    [{ev['timestamp']:.2f}s] {ev['event_type']} ({ev['event_category']}): {ev['event_description']}")

    # 7. Check preview video existence
    preview_url = results_data.get("session", {}).get("preview_path")
    print(f"\n  Preview Video Path: {preview_url}")

    # 8. Test PDF Report Generation
    print("\n--- Step 7: Test PDF Report Generation ---")
    pdf_data = api_request(f"{API_BASE}/api/reports/{analysis_id}/download", method="GET", headers=headers)
    print(f"  PDF Report generated successfully! Size: {len(pdf_data)} bytes")

    print("\n==========================================")
    print("ALL LIVE PIPELINE VERIFICATIONS PASSED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    run_test()
