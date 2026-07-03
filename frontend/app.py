"""
Entry point for the Medical AI Chatbot Streamlit app.
Handles: Login, Register, forced Change-Password flow.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import streamlit as st
import api_client as api

# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Medical AI Assistant",
    page_icon="🏥",
    layout="centered",
    initial_sidebar_state="collapsed",
)

# ---------------------------------------------------------------------------
# Session state defaults
# ---------------------------------------------------------------------------
for key, default in {
    "access_token": None,
    "refresh_token": None,
    "username": None,
    "role": None,
    "must_change_password": False,
}.items():
    if key not in st.session_state:
        st.session_state[key] = default


# ---------------------------------------------------------------------------
# If already logged in → redirect
# ---------------------------------------------------------------------------
if st.session_state["access_token"] and not st.session_state["must_change_password"]:
    st.switch_page("pages/1_Chat.py")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _store_tokens(data: dict):
    st.session_state["access_token"] = data["access_token"]
    st.session_state["refresh_token"] = data["refresh_token"]
    st.session_state["must_change_password"] = data.get("must_change_password", False)


def _store_user(username: str, role: str = "user"):
    st.session_state["username"] = username
    st.session_state["role"] = role


# ---------------------------------------------------------------------------
# Force change-password screen
# ---------------------------------------------------------------------------
if st.session_state["access_token"] and st.session_state["must_change_password"]:
    st.title("🔐 Password Change Required")
    st.warning(
        "Your password has been reset by an administrator. "
        "You must set a new password before continuing."
    )
    with st.form("change_pw_form"):
        old_pw = st.text_input("Current (temporary) password", type="password")
        new_pw = st.text_input("New password (min 6 characters)", type="password")
        new_pw2 = st.text_input("Confirm new password", type="password")
        submitted = st.form_submit_button("Set New Password", use_container_width=True)

    if submitted:
        if not old_pw or not new_pw:
            st.error("All fields are required.")
        elif new_pw != new_pw2:
            st.error("New passwords do not match.")
        elif len(new_pw) < 6:
            st.error("Password must be at least 6 characters.")
        else:
            try:
                api.change_password(old_pw, new_pw)
                st.session_state["must_change_password"] = False
                st.success("Password changed successfully! Redirecting...")
                st.switch_page("pages/1_Chat.py")
            except Exception as e:
                st.error(f"Failed to change password: {e}")
    st.stop()


# ---------------------------------------------------------------------------
# Login / Register tabs
# ---------------------------------------------------------------------------
st.markdown(
    "<h1 style='text-align:center;'>🏥 Medical AI Assistant</h1>",
    unsafe_allow_html=True,
)
st.markdown(
    "<p style='text-align:center; color:gray;'>Powered by Vision Transformer + PubMedBERT + LLM</p>",
    unsafe_allow_html=True,
)
st.divider()

tab_login, tab_register = st.tabs(["Login", "Register"])

# ---- LOGIN ----
with tab_login:
    with st.form("login_form"):
        username = st.text_input("Username", placeholder="Enter your username")
        password = st.text_input("Password", type="password", placeholder="Enter your password")
        submitted = st.form_submit_button("Login", use_container_width=True, type="primary")

    if submitted:
        if not username or not password:
            st.error("Please enter both username and password.")
        else:
            with st.spinner("Logging in..."):
                try:
                    data = api.login(username, password)
                    _store_tokens(data)
                    # Fetch role from the token payload (we decode ourselves or assume "user")
                    # The backend embeds role in JWT — we'll derive it after first authed call
                    # For simplicity: admin username is known, or we call list_users to check
                    # Better: decode JWT locally
                    import base64, json as _json
                    try:
                        payload_b64 = data["access_token"].split(".")[1]
                        payload_b64 += "=" * (-len(payload_b64) % 4)
                        payload = _json.loads(base64.b64decode(payload_b64))
                        _store_user(username, role=payload.get("role", "user"))
                    except Exception:
                        _store_user(username, role="user")

                    if st.session_state["must_change_password"]:
                        st.warning("You must change your password.")
                        st.rerun()
                    else:
                        st.success("Logged in successfully!")
                        st.switch_page("pages/1_Chat.py")
                except Exception as e:
                    st.error(f"Login failed: {e}")

# ---- REGISTER ----
with tab_register:
    with st.form("register_form"):
        reg_username = st.text_input("Username", placeholder="Choose a username (3-50 chars)", key="reg_u")
        reg_email = st.text_input("Email", placeholder="your@email.com", key="reg_e")
        reg_password = st.text_input("Password", type="password", placeholder="Min 6 characters", key="reg_p")
        reg_password2 = st.text_input("Confirm Password", type="password", placeholder="Repeat password", key="reg_p2")
        submitted_reg = st.form_submit_button("Create Account", use_container_width=True, type="primary")

    if submitted_reg:
        if not reg_username or not reg_email or not reg_password:
            st.error("All fields are required.")
        elif len(reg_username) < 3:
            st.error("Username must be at least 3 characters.")
        elif reg_password != reg_password2:
            st.error("Passwords do not match.")
        elif len(reg_password) < 6:
            st.error("Password must be at least 6 characters.")
        else:
            with st.spinner("Creating account..."):
                try:
                    data = api.register(reg_username, reg_email, reg_password)
                    _store_tokens(data)
                    _store_user(reg_username, role="user")
                    st.success("Account created! Redirecting to chat...")
                    st.switch_page("pages/1_Chat.py")
                except Exception as e:
                    st.error(f"Registration failed: {e}")

# ---------------------------------------------------------------------------
# System status footer
# ---------------------------------------------------------------------------
st.divider()
col1, col2 = st.columns(2)
with col1:
    health = api.health_check()
    status = health.get("status", "unreachable")
    icon = "🟢" if status == "healthy" else "🔴"
    st.caption(f"{icon} API: **{status}**")
with col2:
    ready = api.ready_check()
    r_status = ready.get("status", "unreachable")
    r_icon = "🟢" if r_status == "ready" else "🟡"
    st.caption(f"{r_icon} Models: **{r_status}**")
