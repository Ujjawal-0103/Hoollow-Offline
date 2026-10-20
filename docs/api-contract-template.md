# Hackathon API Contract Template

> **Instructions for Team:**
> Complete this contract within the first 15–20 minutes after reading the problem statement.
> Once filled out and committed, Frontend and Backend developers can build in parallel against these interfaces.

---

## 1. Global API Conventions

- **Base URL:** `http://localhost:3001/api` (Production/Cloud: `/api`)
- **Content-Type:** `application/json`
- **Standard Success Response Format:**
  ```json
  {
    "success": true,
    "data": {},
    "timestamp": "2026-10-18T10:00:00.000Z"
  }
  ```
- **Standard Error Response Format:**
  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "Human readable error description",
    "errors": ["Specific field error if applicable"]
  }
  ```

---

## 2. Core Endpoints

### Endpoint 1: Health & Readiness
- **Method:** `GET`
- **Path:** `/api/health`
- **Auth:** None
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "uptime": 124.5,
    "database": "connected"
  }
  ```

---

### Endpoint 2: Primary Resource List / Query
- **Method:** `GET`
- **Path:** `/api/[resources]` *(e.g. `/api/items`, `/api/tasks`, `/api/reports`)*
- **Query Params:**
  - `limit` (optional, default: 20)
  - `status` (optional)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cuid_or_uuid",
        "title": "Sample Title",
        "status": "ACTIVE",
        "createdAt": "2026-10-18T10:00:00.000Z"
      }
    ]
  }
  ```

---

### Endpoint 3: Primary Resource Submission
- **Method:** `POST`
- **Path:** `/api/[resources]`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "title": "Required string (min 3 chars)",
    "description": "Optional string",
    "category": "CATEGORY_A"
  }
  ```
- **Validation Rules:**
  - `title`: required, string, min 3, max 100
  - `category`: required, enum
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "cuid_generated",
      "title": "Sample Title",
      "description": "Optional string",
      "category": "CATEGORY_A",
      "createdAt": "2026-10-18T10:05:00.000Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Validation failure on required fields.

---

### Endpoint 4: Primary Resource Action / Process
- **Method:** `POST` / `PATCH`
- **Path:** `/api/[resources]/:id/action` *(e.g. `/api/analyze`, `/api/process`)*
- **Request Body:**
  ```json
  {
    "parameters": {}
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "result": "Processed output",
      "confidence": 0.98
    }
  }
  ```
