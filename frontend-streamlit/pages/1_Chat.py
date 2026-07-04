"""
ChatGPT-style chatbot page.
- Sidebar: session list, new chat, user info, logout
- Main: chat bubbles with SSE streaming assistant responses
- Image upload per message (optional)
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import streamlit as st
import api_client as api
import base64
import time

# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Medical AI Chat",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# Auth guard
# ---------------------------------------------------------------------------
if not st.session_state.get("access_token"):
    st.switch_page("app.py")

if st.session_state.get("must_change_password"):
    st.switch_page("app.py")

# ---------------------------------------------------------------------------
# Session state defaults
# ---------------------------------------------------------------------------
for key, default in {
    "current_session_id": None,
    "current_session_title": "New Chat",
    "messages": [],           # list of dicts: {role, content, image_url}
    "sessions_list": [],      # fetched from API
    "sessions_loaded": False,
    "pending_image": None,    # bytes of image queued for next send
    "pending_image_name": None,
    "pending_image_type": None,
}.items():
    if key not in st.session_state:
        st.session_state[key] = default


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def load_sessions():
    try:
        st.session_state["sessions_list"] = api.list_sessions(limit=50)
        st.session_state["sessions_loaded"] = True
    except Exception as e:
        st.session_state["sessions_list"] = []
        st.session_state["sessions_loaded"] = True


def load_session_messages(session_id: str):
    try:
        data = api.get_session(session_id)
        messages = []
        for msg in data.get("messages", []):
            messages.append({
                "role": msg["role"],
                "content": msg["content"],
                "image_url": msg.get("image_url"),
            })
        st.session_state["messages"] = messages
        st.session_state["current_session_id"] = session_id
        st.session_state["current_session_title"] = data.get("title") or "Chat"
    except Exception as e:
        st.error(f"Failed to load session: {e}")


def create_new_session():
    try:
        data = api.create_session()
        st.session_state["current_session_id"] = data["id"]
        st.session_state["current_session_title"] = data.get("title") or "New Chat"
        st.session_state["messages"] = []
        load_sessions()
    except Exception as e:
        st.error(f"Failed to create session: {e}")


def do_logout():
    api.logout()
    for key in ["access_token", "refresh_token", "username", "role",
                "must_change_password", "current_session_id", "messages",
                "sessions_list", "sessions_loaded"]:
        st.session_state[key] = None if key in ["access_token", "refresh_token",
                                                  "username", "role",
                                                  "current_session_id"] else (
            False if key == "must_change_password" else
            [] if key in ["messages", "sessions_list"] else False
        )
    st.switch_page("app.py")


# Load sessions once per page visit
if not st.session_state["sessions_loaded"]:
    load_sessions()


# ---------------------------------------------------------------------------
# SIDEBAR
# ---------------------------------------------------------------------------
with st.sidebar:
    st.markdown("## 🏥 Medical AI")
    st.divider()

    # New Chat button
    if st.button("➕ New Chat", use_container_width=True, type="primary"):
        create_new_session()
        st.rerun()

    st.markdown("### Chat History")

    sessions = st.session_state.get("sessions_list", [])
    if not sessions:
        st.caption("No chats yet. Start a new one!")
    else:
        for sess in sessions:
            sess_id = sess["id"]
            title = sess.get("title") or "Untitled"
            msg_count = sess.get("message_count", 0)
            is_active = st.session_state["current_session_id"] == sess_id

            col_btn, col_del = st.columns([5, 1])
            with col_btn:
                label = f"{'▶ ' if is_active else ''}{title[:35]}"
                if st.button(
                    label,
                    key=f"sess_{sess_id}",
                    use_container_width=True,
                    help=f"{msg_count} messages",
                ):
                    load_session_messages(sess_id)
                    st.rerun()
            with col_del:
                if st.button("🗑", key=f"del_{sess_id}", help="Delete session"):
                    try:
                        api.delete_session(sess_id)
                        if st.session_state["current_session_id"] == sess_id:
                            st.session_state["current_session_id"] = None
                            st.session_state["messages"] = []
                            st.session_state["current_session_title"] = "New Chat"
                        load_sessions()
                        st.rerun()
                    except Exception as e:
                        st.error(f"Delete failed: {e}")

    st.divider()

    # User info
    username = st.session_state.get("username", "User")
    role = st.session_state.get("role", "user")
    role_badge = "👑 Admin" if role == "admin" else "👤 User"
    st.caption(f"Logged in as **{username}**")
    st.caption(f"Role: {role_badge}")

    if role == "admin":
        if st.button("⚙️ Admin Panel", use_container_width=True):
            st.switch_page("pages/2_Admin.py")

    if st.button("🚪 Logout", use_container_width=True):
        do_logout()


# ---------------------------------------------------------------------------
# MAIN CHAT AREA
# ---------------------------------------------------------------------------
current_session_id = st.session_state.get("current_session_id")

# Header
title = st.session_state.get("current_session_title", "Medical AI Chat")
if current_session_id:
    st.markdown(f"### 💬 {title}")
else:
    st.markdown("### 💬 Medical AI Assistant")
    st.markdown(
        "> Start a **New Chat** from the sidebar, or select an existing session.\n\n"
        "> Upload a medical image and ask questions — the AI will analyze it using "
        "specialized Vision Transformer models."
    )

st.divider()

# ---------------------------------------------------------------------------
# Render existing messages
# ---------------------------------------------------------------------------
if current_session_id and st.session_state["messages"]:
    for msg in st.session_state["messages"]:
        role = msg["role"]
        content = msg["content"]
        image_url = msg.get("image_url")

        avatar = "🧑‍⚕️" if role == "user" else "🤖"
        with st.chat_message(role, avatar=avatar):
            # Show image if present
            if image_url:
                try:
                    st.image(image_url, width=320)
                except Exception:
                    st.caption("_(image unavailable)_")
            # Show content — strip internal tool notes for cleaner UI
            display_content = content
            if role == "assistant":
                # Remove [Tool ...] internal notes from display
                import re
                display_content = re.sub(r"\*\[Tool[^\]]*\]\*\n?", "", content).strip()
            if display_content:
                st.markdown(display_content)

elif current_session_id and not st.session_state["messages"]:
    st.info("No messages yet. Send your first message below!")


# ---------------------------------------------------------------------------
# Image uploader (above chat input)
# ---------------------------------------------------------------------------
if current_session_id:
    uploaded_file = st.file_uploader(
        "📎 Attach a medical image (optional)",
        type=["jpg", "jpeg", "png"],
        key=f"uploader_{current_session_id}",
        label_visibility="collapsed",
        help="Upload a JPEG/PNG medical image (X-ray, CT, MRI, etc.)",
    )

    if uploaded_file:
        # Preview the pending image
        col_prev, col_info = st.columns([1, 3])
        with col_prev:
            st.image(uploaded_file, width=140)
        with col_info:
            st.caption(f"📎 **{uploaded_file.name}**")
            size_kb = uploaded_file.size / 1024
            st.caption(f"Size: {size_kb:.1f} KB | Type: {uploaded_file.type}")
            if size_kb > 5 * 1024:
                st.warning("Image exceeds 5 MB limit.")

        # Store pending image in session state
        st.session_state["pending_image"] = uploaded_file.read()
        st.session_state["pending_image_name"] = uploaded_file.name
        st.session_state["pending_image_type"] = uploaded_file.type
    else:
        st.session_state["pending_image"] = None
        st.session_state["pending_image_name"] = None
        st.session_state["pending_image_type"] = None


# ---------------------------------------------------------------------------
# Chat input & streaming response
# ---------------------------------------------------------------------------
if current_session_id:
    prompt = st.chat_input("Ask a question about the medical image...")

    if prompt:
        image_bytes = st.session_state.get("pending_image")
        image_name = st.session_state.get("pending_image_name", "image.jpg")
        image_type = st.session_state.get("pending_image_type", "image/jpeg")

        # 1. Show user message immediately
        with st.chat_message("user", avatar="🧑‍⚕️"):
            if image_bytes:
                # Display preview from bytes
                import io
                from PIL import Image as PILImage
                try:
                    pil_img = PILImage.open(io.BytesIO(image_bytes))
                    st.image(pil_img, width=320)
                except Exception:
                    pass
            st.markdown(prompt)

        # Optimistically add to local message list (without image_url yet)
        st.session_state["messages"].append({
            "role": "user",
            "content": prompt,
            "image_url": None,
        })

        # 2. Stream assistant response
        with st.chat_message("assistant", avatar="🤖"):
            placeholder = st.empty()
            full_response = ""
            tool_calls_info = []
            error_occurred = False

            with st.spinner("Thinking..."):
                # Small delay to show spinner
                time.sleep(0.1)

            try:
                for event in api.send_message_stream(
                    session_id=current_session_id,
                    message=prompt,
                    image_bytes=image_bytes,
                    image_name=image_name,
                    image_type=image_type,
                ):
                    ev_type = event.get("event")
                    ev_data = event.get("data", {})

                    if ev_type == "message":
                        chunk = ev_data.get("content", "")
                        full_response += chunk
                        # Show streaming text with cursor
                        placeholder.markdown(full_response + "▌")

                    elif ev_type == "tool_call":
                        tools = ev_data.get("tools", [])
                        for t in tools:
                            tool_calls_info.append(t.get("name", ""))
                        # Show a subtle tool-calling indicator
                        tool_names = ", ".join(tool_calls_info)
                        placeholder.markdown(
                            f"_{full_response}_\n\n"
                            f"🔬 *Analyzing image using: {tool_names}...*"
                        )

                    elif ev_type == "done":
                        break

                    elif ev_type == "error":
                        error_occurred = True
                        detail = ev_data.get("detail", "Unknown error")
                        full_response = f"An error occurred: {detail}"
                        break

            except Exception as e:
                error_occurred = True
                full_response = f"Connection error: {e}"

            # Final render (remove cursor)
            import re
            display = re.sub(r"\*\[Tool[^\]]*\]\*\n?", "", full_response).strip()
            if display:
                placeholder.markdown(display)
            elif not error_occurred:
                placeholder.markdown("_(No response)_")

        # 3. Add assistant message to local state
        st.session_state["messages"].append({
            "role": "assistant",
            "content": full_response,
            "image_url": None,
        })

        # 4. Refresh session list to update message counts / titles
        load_sessions()

        # 5. Clear pending image
        st.session_state["pending_image"] = None

        # Rerun to update session title in sidebar
        st.rerun()

elif not current_session_id:
    # Prompt user to start a chat when no session selected
    st.markdown(
        """
        <div style='text-align:center; padding: 60px 0; color: #888;'>
            <h2>🏥 Medical AI Assistant</h2>
            <p>Upload a medical image and ask questions in natural language.</p>
            <p>The AI uses Vision Transformer models to analyze X-rays, CT scans, MRIs and more.</p>
            <br/>
            <p><b>Click "➕ New Chat" in the sidebar to get started.</b></p>
        </div>
        """,
        unsafe_allow_html=True,
    )
