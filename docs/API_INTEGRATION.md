# Medical VQA & Chatbot System - React/Web Integration Guide 🏥⚛️

This document provides a comprehensive integration guide for developers migrating the Streamlit frontend to a modern single-page application built with **React** (or Next.js). It details all API endpoints, authentication workflows, SSE (Server-Sent Events) chat streaming, and common integration patterns.

---

## 1. Overview & Setup

### Base Configuration
- **API Base URL**: `http://localhost:8000` (or production domain)
- **API Path Prefix**: `/api/v1`
- **CORS Configuration**: The backend currently has `allow_origins=["*"]` configured. In a production environment, this should be restricted to your specific frontend domain.

### Storage & Security
- **Authentication**: JWT Bearer authentication is required for all data and inference endpoints.
- **Tokens**:
  - `access_token` (expires in 30 minutes, stored in memory or short-lived state).
  - `refresh_token` (expires in 7 days, securely stored in a secure, HTTP-only cookie or LocalStorage if necessary).

---

## 2. Authentication Flow

Your React application should manage authentication via a central context provider (`AuthContext`).

### Login Flow Diagram
1. Client calls `POST /api/v1/auth/login` with username & password.
2. Server returns `access_token` and `refresh_token`.
3. Client stores the `access_token` in React state (memory) and `refresh_token` in LocalStorage.
4. Client configures an Axios interceptor to automatically attach `Authorization: Bearer <access_token>` to outgoing requests.

### Token Auto-Refresh (Axios Interceptor Pattern)
When the access token expires (indicated by a `401 Unauthorized` response), the client should intercept the failed request, call the refresh endpoint to obtain a new token pair, update state, and replay the original request.

Here is the recommended **TypeScript/Axios** configuration:

```typescript
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token'); // Or from app state/context
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for auto-refresh on 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle logout/blacklist or expired token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        // Redirect to login
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(null, access_token);
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Clear local storage and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 3. Complete Endpoint Reference

This section details all **21 endpoints** exposed by the FastAPI server.

### A. Health & System Metrics (Public)

#### 1. `GET /health`
* **Purpose**: Basic health check for Docker, load balancers, and monitoring.
* **Auth**: None
* **Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "version": "1.0.0"
  }
  ```

#### 2. `GET /ready`
* **Purpose**: Checks whether the deep learning models (ViT & PubMedBERT) have finished loading into RAM/VRAM.
* **Auth**: None
* **Response (200 OK - Models Loaded)**:
  ```json
  {
    "status": "ready",
    "models_loaded": true,
    "vqa_enabled": true,
    "captioning_enabled": true,
    "device": "cuda" // or "cpu"
  }
  ```
* **Response (503 Service Unavailable - Still Loading)**:
  * Headers: `Content-Type: text/plain`
  * Body: `Models not fully loaded yet.`

#### 3. `GET /metrics`
* **Purpose**: Exposes Prometheus-compatible runtime metrics.
* **Auth**: None
* **Response**: Plain text in Prometheus Exposition Format.

---

### B. Authentication (`/api/v1/auth`)

#### 4. `POST /api/v1/auth/register`
* **Purpose**: Register a new user account.
* **Auth**: None
* **Request Body**:
  ```json
  {
    "username": "johndoe",  // min length: 3, max length: 50
    "email": "john@vqa.com", // valid email format
    "password": "SecurePassword123" // min length: 6
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "access_token": "ey...",
    "refresh_token": "ey...",
    "token_type": "bearer",
    "must_change_password": false
  }
  ```
* **Common Errors**:
  * `400 Bad Request`: `{"detail": "Username already registered"}` or `{"detail": "Email already registered"}`

#### 5. `POST /api/v1/auth/login`
* **Purpose**: Log in and retrieve JWT tokens.
* **Auth**: None
* **Request Body**:
  ```json
  {
    "username": "johndoe",
    "password": "SecurePassword123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "access_token": "ey...",
    "refresh_token": "ey...",
    "token_type": "bearer",
    "must_change_password": false
  }
  ```
* **Common Errors**:
  * `401 Unauthorized`: `{"detail": "Incorrect username or password"}`
  * `400 Bad Request`: `{"detail": "Inactive user"}`

#### 6. `POST /api/v1/auth/refresh`
* **Purpose**: Refresh an expired access token using a refresh token.
* **Auth**: None (Token passed in body)
* **Request Body**:
  ```json
  {
    "refresh_token": "ey..."
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "access_token": "ey...",
    "refresh_token": "ey...",
    "token_type": "bearer",
    "must_change_password": false
  }
  ```
* **Common Errors**:
  * `401 Unauthorized`: `{"detail": "Could not validate credentials"}` or `{"detail": "Token revoked"}`

#### 7. `POST /api/v1/auth/logout`
* **Purpose**: Revoke/blacklist active tokens to secure logouts.
* **Auth**: **Bearer Token required**
* **Request Headers**: `Authorization: Bearer <access_token>`
* **Request Body** (Optional):
  ```json
  {
    "refresh_token": "ey..." // Recommended to blacklist refresh token too
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "msg": "Successfully logged out"
  }
  ```

#### 8. `POST /api/v1/auth/change-password` & 9. `PUT /api/v1/auth/change-password`
* **Purpose**: Allows users to change their password (required if `must_change_password` is true).
* **Auth**: **Bearer Token required**
* **Request Body**:
  ```json
  {
    "old_password": "SecurePassword123",
    "new_password": "MyNewSecurePassword456" // min length: 6
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "msg": "Password updated successfully"
  }
  ```
* **Common Errors**:
  * `400 Bad Request`: `{"detail": "Incorrect old password"}`

---

### C. Admin User Management (`/api/v1/admin/users`)

*All endpoints in this group require the caller to have the `"admin"` role.*

#### 10. `GET /api/v1/admin/users/`
* **Purpose**: Fetch a paginated list of all users.
* **Auth**: **Bearer Token + Admin Role**
* **Query Parameters**:
  - `skip`: (default: 0) Offset for pagination.
  - `limit`: (default: 100) Max users to return.
* **Response (200 OK)**:
  ```json
  [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "username": "johndoe",
      "email": "john@vqa.com",
      "role": "user",
      "is_active": true,
      "created_at": "2026-07-04T12:00:00"
    }
  ]
  ```

#### 11. `GET /api/v1/admin/users/{user_id}`
* **Purpose**: Fetch details of a specific user.
* **Auth**: **Bearer Token + Admin Role**
* **Response (200 OK)**:
  *(Same object shape as user list above)*

#### 12. `PUT /api/v1/admin/users/{user_id}/reset-password`
* **Purpose**: Resets a user's password.
* **Auth**: **Bearer Token + Admin Role**
* **Request Body**:
  ```json
  {
    "new_password": "ResetPassword123" // Optional. Defaults to "ChangeMe@123" if null/omitted
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "msg": "Password reset successfully. User must change it on next login."
  }
  ```

#### 13. `PUT /api/v1/admin/users/{user_id}/deactivate`
* **Purpose**: Disables a user account (cannot deactivate yourself).
* **Auth**: **Bearer Token + Admin Role**
* **Response (200 OK)**:
  ```json
  {
    "msg": "User deactivated"
  }
  ```

#### 14. `PUT /api/v1/admin/users/{user_id}/activate`
* **Purpose**: Re-enables a deactivated user account.
* **Auth**: **Bearer Token + Admin Role**
* **Response (200 OK)**:
  ```json
  {
    "msg": "User activated"
  }
  ```

---

### D. Medical AI Inference (`/api/v1`)

#### 15. `POST /api/v1/predict` (VQA)
* **Purpose**: Uploads a medical image and requests a specific text classification/VQA answer.
* **Auth**: **Bearer Token required**
* **Rate Limit**: 30 requests per minute.
* **Content-Type**: `multipart/form-data`
* **Request Body (Form Data)**:
  - `image`: File (JPEG/PNG, max 5MB)
  - `question`: String (e.g., "What weighting is used in this MR image?", max 128 characters)
* **Response (200 OK)**:
  ```json
  {
    "answer": "T2",
    "confidence": 0.9987, // Confidence score (0.0 to 1.0)
    "inference_time_ms": 42.50 // Will be 0.0 if served from cache
  }
  ```
* **Common Errors**:
  * `400 Bad Request`: `{"error": "Question cannot be empty."}` or `{"error": "Question too long..."}`
  * `503 Service Unavailable`: `{"error": "VQA Model is still loading or unavailable."}`
  * `429 Too Many Requests`: Rate limit exceeded.

#### 16. `POST /api/v1/caption` (Image Captioning)
* **Purpose**: Uploads a medical image and returns an auto-generated descriptive caption.
* **Auth**: **Bearer Token required**
* **Rate Limit**: 30 requests per minute.
* **Content-Type**: `multipart/form-data`
* **Request Body (Form Data)**:
  - `image`: File (JPEG/PNG, max 5MB)
* **Response (200 OK)**:
  ```json
  {
    "caption": "Axial CT image of the abdomen showing normal liver and kidneys.",
    "inference_time_ms": 150.50 // Will be 0.0 if served from cache
  }
  ```

---

### E. Chatbot Sessions (`/api/v1/chat`)

#### 17. `POST /api/v1/chat/sessions`
* **Purpose**: Create a new empty chat conversation session.
* **Auth**: **Bearer Token required**
* **Response (200 OK)**:
  ```json
  {
    "id": "8e3cdde9-a864-4e4b-b0b3-909df535a09c",
    "title": "New Session",
    "message_count": 0,
    "created_at": "2026-07-04T12:00:00",
    "updated_at": "2026-07-04T12:00:00"
  }
  ```

#### 18. `GET /api/v1/chat/sessions`
* **Purpose**: Retrieve the paginated list of chat sessions for the active user.
* **Auth**: **Bearer Token required**
* **Query Parameters**:
  - `skip`: pagination offset (default: 0)
  - `limit`: pagination page size (default: 20)
* **Response (200 OK)**:
  ```json
  [
    {
      "id": "8e3cdde9-a864-4e4b-b0b3-909df535a09c",
      "title": "Abdominal MRI Scan discussion",
      "message_count": 4,
      "created_at": "2026-07-04T12:00:00",
      "updated_at": "2026-07-04T12:10:00"
    }
  ]
  ```

#### 19. `GET /api/v1/chat/sessions/{session_id}`
* **Purpose**: Fetch a complete chat session, including the conversation history.
* **Auth**: **Bearer Token required**
* **Response (200 OK)**:
  ```json
  {
    "id": "8e3cdde9-a864-4e4b-b0b3-909df535a09c",
    "title": "Abdominal MRI Scan discussion",
    "message_count": 2,
    "created_at": "2026-07-04T12:00:00",
    "updated_at": "2026-07-04T12:10:00",
    "messages": [
      {
        "id": "771b9c78-1a52-4467-bc1a-5527a69da2fc",
        "role": "user",
        "content": "What is shown in this image?",
        "image_url": "http://localhost:9000/vqa-bucket/uploads/user1/image.jpg?AWSAccessKeyId=...", // Presigned MinIO URL
        "created_at": "2026-07-04T12:00:00"
      },
      {
        "id": "902d8f99-a1b2-4cd3-a8ef-7a76c8c9e01f",
        "role": "assistant",
        "content": "Based on the image details, this is an abdominal MRI. Let me know if you want me to analyze any specific organ.",
        "image_url": null,
        "created_at": "2026-07-04T12:00:05"
      }
    ]
  }
  ```
  *Note: The `image_url` is a secure, temporary presigned link that expires after 2 hours.*

#### 20. `DELETE /api/v1/chat/sessions/{session_id}`
* **Purpose**: Delete a chat session. This cleans up all corresponding message logs and deletes uploaded images from object storage (MinIO).
* **Auth**: **Bearer Token required**
* **Response (204 No Content)**: Empty body.

#### 21. `POST /api/v1/chat/sessions/{session_id}/messages` (Chat/SSE)
* **Purpose**: Sends a message to the chatbot. Supports optional image attachments. Returns a real-time streamed response.
* **Auth**: **Bearer Token required**
* **Content-Type**: `multipart/form-data`
* **Request Body (Form Data)**:
  - `message`: String (required)
  - `image`: File (Optional. Must be JPEG/PNG, max 5MB. If omitted, the chatbot will default to using the most recently uploaded image in the session, enabling follow-up questions).
* **Response**: `text/event-stream` (See section 4 below for details).

---

## 4. SSE Streaming Integration

Standard React components using traditional HTTP fetch or WebSockets cannot naturally consume Server-Sent Events when a `POST` request with headers and `multipart/form-data` payload is required.

To resolve this, you must consume the stream manually via `fetch` and a `ReadableStream` reader, or use a streaming library like `@microsoft/fetch-event-source`.

### SSE Stream Protocol Structure
The streaming endpoint outputs text lines formatted as follows:

```text
event: <event_type>
data: <json_string>
```

#### Event Types & Data Structures:
1. **`message`**: Contains textual response increments.
   ```json
   {"content": "T"}
   ```
2. **`tool_call`**: Emitted when the orchestrator calls a local vision tool (`analyze_medical_image` or `describe_medical_image`).
   ```json
   {"tools": [{"name": "describe_medical_image", "args": {}}]}
   ```
3. **`done`**: Sent once when generation ends and the assistant's reply has been persisted.
   ```json
   {"status": "completed"}
   ```
4. **`error`**: Indicates a server-side crash.
   ```json
   {"detail": "An error occurred during generation"}
   ```

---

### React SSE Integration Example

Here is a complete, production-ready React Hook (`useSSEChat`) to stream chatbot conversations.

```typescript
import { useState, useCallback } from 'react';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  image_url?: string | null;
  toolsUsed?: Array<{ name: string; args: any }>;
}

export const useSSEChat = (baseUrl: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [activeTools, setActiveTools] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const sendMessage = useCallback(async (
    sessionId: string, 
    text: string, 
    imageFile?: File
  ) => {
    const token = localStorage.getItem('access_token');
    setIsGenerating(true);
    setStreamingContent('');
    setActiveTools([]);

    // 1. Add the user message immediately to the UI
    const tempUserMsg: ChatMessage = {
      role: 'user',
      content: text,
      image_url: imageFile ? URL.createObjectURL(imageFile) : null
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // 2. Prepare FormData
    const formData = new FormData();
    formData.append('message', text);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await fetch(`${baseUrl}/api/v1/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Do NOT set Content-Type header; the browser will automatically include boundary boundaries
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let buffer = '';
      let currentResponseText = '';
      let toolsCalled: any[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Parse SSE stream format
        const lines = buffer.split('\n');
        // Keep the last partial line in buffer
        buffer = lines.pop() || '';

        let currentEvent = '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;

          if (cleanLine.startsWith('event:')) {
            currentEvent = cleanLine.replace('event:', '').trim();
          } else if (cleanLine.startsWith('data:')) {
            const dataStr = cleanLine.replace('data:', '').trim();
            try {
              const parsed = JSON.parse(dataStr);

              if (currentEvent === 'message') {
                currentResponseText += parsed.content;
                setStreamingContent(currentResponseText);
              } else if (currentEvent === 'tool_call') {
                if (parsed.tools) {
                  toolsCalled = [...toolsCalled, ...parsed.tools];
                  setActiveTools(toolsCalled);
                }
              } else if (currentEvent === 'done') {
                setIsGenerating(false);
              } else if (currentEvent === 'error') {
                throw new Error(parsed.detail || 'Generation failed');
              }
            } catch (e) {
              console.warn('Failed to parse SSE data', dataStr, e);
            }
          }
        }
      }

      // 3. Finalize: append the completed assistant response to history
      const finalAssistantMsg: ChatMessage = {
        role: 'assistant',
        content: currentResponseText,
        toolsUsed: toolsCalled.length > 0 ? toolsCalled : undefined
      };
      setMessages(prev => [...prev, finalAssistantMsg]);
      setStreamingContent('');
      setActiveTools([]);

    } catch (err: any) {
      console.error('Error during chat stream:', err);
      // Append error message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${err.message || 'Unable to complete request'}`
      }]);
    } finally {
      setIsGenerating(false);
    }
  }, [baseUrl]);

  return {
    messages,
    setMessages,
    streamingContent,
    activeTools,
    isGenerating,
    sendMessage
  };
};
```

---

## 5. React Integration Patterns

### Creating a Chat Interface Component
Below is an example chat screen in React that integrates the `useSSEChat` hook:

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { useSSEChat } from '../hooks/useSSEChat';

export const MedicalChatWindow = ({ sessionId }: { sessionId: string }) => {
  const { messages, streamingContent, activeTools, isGenerating, sendMessage } = useSSEChat('http://localhost:8000');
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, activeTools]);

  const handleSend = () => {
    if (!inputText.trim() && !selectedFile) return;
    sendMessage(sessionId, inputText, selectedFile || undefined);
    setInputText('');
    setSelectedFile(null);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 bg-gray-50">
      <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded bg-white shadow-sm">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-3 rounded-lg max-w-xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              {msg.image_url && <img src={msg.image_url} alt="Attached medical scan" className="max-w-xs mb-2 rounded border" />}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.toolsUsed && (
              <span className="text-xs text-gray-400 mt-1 italic">
                Tools executed: {msg.toolsUsed.map(t => t.name).join(', ')}
              </span>
            )}
          </div>
        ))}

        {/* Real-time Streaming Response Visualizer */}
        {isGenerating && (
          <div className="flex flex-col items-start">
            {/* Show active tool invocation feedback */}
            {activeTools.length > 0 && (
              <div className="flex items-center space-x-2 text-xs text-blue-500 mb-2 animate-pulse">
                <span>🤖 Running medical vision models:</span>
                {activeTools.map((t, idx) => (
                  <span key={idx} className="bg-blue-100 px-2 py-0.5 rounded font-mono font-bold">
                    {t.name}
                  </span>
                ))}
              </div>
            )}
            
            {streamingContent && (
              <div className="p-3 rounded-lg bg-gray-100 text-gray-800 max-w-xl">
                <p className="whitespace-pre-wrap">{streamingContent}</p>
                <span className="inline-block w-2 h-4 bg-gray-500 animate-blink ml-1"></span>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Tray */}
      <div className="mt-4 flex flex-col space-y-2">
        {selectedFile && (
          <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded text-xs border border-blue-200">
            <span>📷 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            <button onClick={() => setSelectedFile(null)} className="text-red-500 font-bold hover:underline">Remove</button>
          </div>
        )}
        <div className="flex space-x-2">
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
            className="hidden" 
            id="file-upload" 
          />
          <label htmlFor="file-upload" className="px-4 py-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300 transition text-center select-none text-sm font-medium">
            Attach Image
          </label>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your scan..."
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
            disabled={isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={isGenerating}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 6. Error Handling Reference

All backend validation errors follow structured standard responses.

### Error Response Schema
```json
{
  "error": "Error tag / message",
  "details": "Details or cause of the error"
}
```

### HTTP Status Code Meanings
* **`400 Bad Request`**: Input validation failure (e.g. empty message, image exceeds 5MB, invalid credentials, password not secure, session message limit exceeded).
* **`401 Unauthorized`**: Expired, missing, or blacklisted authorization token.
* **`403 Forbidden`**: Role mismatch (e.g. user trying to access admin endpoints) or access control violation (viewing someone else's chat session).
* **`404 Not Found`**: Target object does not exist (e.g. session not found, user not found).
* **`429 Too Many Requests`**: Rate limit exceeded on prediction endpoints (max 30 requests/minute).
* **`500 Internal Server Error`**: Unexpected pipeline or database crash.
* **`503 Service Unavailable`**: Vision models are still loading during system startup.

---

## 7. Configuration Constants

Ensure your frontend configuration enforces these limits locally to optimize performance and prevent unnecessary API roundtrips.

| Constraint | Backend Value | Action |
|---|---|---|
| **Max Image Size** | `5 MB` | Validate on file input: `file.size <= 5 * 1024 * 1024` |
| **Max Question Length** | `128 characters` | Set input property: `maxLength={128}` |
| **Max Message Count** | `50 per session` | Prevent sending if session size has reached `50` |
| **Min Password Length** | `6 characters` | Validate before calling register/change-password |
| **Presigned URL Expiry** | `2 hours` | Keep in mind that older loaded messages will require a session reload if left open for long periods |
| **Predict Cache TTL** | `3600 seconds (1 hour)` | Redis automatically expires cache hits after 1 hour |
