"""
Admin panel page — only accessible by users with role == 'admin'.
Provides: user listing, reset password, activate/deactivate.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import streamlit as st
import api_client as api

# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Admin Panel",
    page_icon="⚙️",
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

# Role guard
if st.session_state.get("role") != "admin":
    st.error("🚫 Access Denied — Admin privileges required.")
    st.stop()

# ---------------------------------------------------------------------------
# Sidebar nav
# ---------------------------------------------------------------------------
with st.sidebar:
    st.markdown("## ⚙️ Admin Panel")
    st.divider()
    if st.button("💬 Back to Chat", use_container_width=True):
        st.switch_page("pages/1_Chat.py")
    st.divider()
    username = st.session_state.get("username", "admin")
    st.caption(f"Logged in as **{username}** (admin)")
    if st.button("🚪 Logout", use_container_width=True):
        api.logout()
        for k in ["access_token", "refresh_token", "username", "role",
                  "must_change_password", "current_session_id", "messages",
                  "sessions_list", "sessions_loaded"]:
            if k in st.session_state:
                del st.session_state[k]
        st.switch_page("app.py")


# ---------------------------------------------------------------------------
# Page header
# ---------------------------------------------------------------------------
st.title("⚙️ Admin Panel")
st.markdown("Manage users, reset passwords, and control account access.")
st.divider()

# ---------------------------------------------------------------------------
# Load users
# ---------------------------------------------------------------------------
if "admin_users" not in st.session_state:
    st.session_state["admin_users"] = []

def refresh_users():
    try:
        st.session_state["admin_users"] = api.list_users(limit=200)
    except Exception as e:
        st.error(f"Failed to load users: {e}")

if not st.session_state["admin_users"]:
    refresh_users()

col_header, col_refresh = st.columns([5, 1])
with col_header:
    st.subheader(f"Users ({len(st.session_state['admin_users'])})")
with col_refresh:
    if st.button("🔄 Refresh", help="Reload user list"):
        refresh_users()
        st.rerun()

# ---------------------------------------------------------------------------
# Reset password dialog state
# ---------------------------------------------------------------------------
if "reset_pw_user_id" not in st.session_state:
    st.session_state["reset_pw_user_id"] = None
if "reset_pw_username" not in st.session_state:
    st.session_state["reset_pw_username"] = None

# ---------------------------------------------------------------------------
# User table
# ---------------------------------------------------------------------------
users = st.session_state["admin_users"]
current_admin_id = None

if not users:
    st.info("No users found.")
else:
    # Find current admin's own ID to prevent self-deactivation
    for u in users:
        if u.get("username") == st.session_state.get("username"):
            current_admin_id = u.get("id")

    # Table header
    col_widths = [2, 3, 1.2, 1, 2]
    hdr = st.columns(col_widths)
    for label, col in zip(["**Username**", "**Email**", "**Role**", "**Status**", "**Actions**"], hdr):
        col.markdown(label)
    st.divider()

    for user in users:
        uid = user.get("id")
        uname = user.get("username", "")
        email = user.get("email", "")
        role = user.get("role", "user")
        is_active = user.get("is_active", True)
        is_self = uid == current_admin_id

        cols = st.columns(col_widths)
        cols[0].write(uname)
        cols[1].write(email)

        role_badge = "👑 admin" if role == "admin" else "👤 user"
        cols[2].write(role_badge)

        status_badge = "🟢 Active" if is_active else "🔴 Inactive"
        cols[3].write(status_badge)

        # Action buttons in last column
        with cols[4]:
            action_cols = st.columns(3)

            # Reset password button
            with action_cols[0]:
                if st.button(
                    "🔑",
                    key=f"reset_{uid}",
                    help=f"Reset password for {uname}",
                    disabled=is_self,
                ):
                    st.session_state["reset_pw_user_id"] = uid
                    st.session_state["reset_pw_username"] = uname
                    st.rerun()

            # Deactivate / Activate button
            with action_cols[1]:
                if is_active:
                    if st.button(
                        "🚫",
                        key=f"deact_{uid}",
                        help=f"Deactivate {uname}",
                        disabled=is_self,
                    ):
                        try:
                            api.deactivate_user(uid)
                            st.toast(f"User **{uname}** deactivated.", icon="🚫")
                            refresh_users()
                            st.rerun()
                        except Exception as e:
                            st.error(f"Failed: {e}")
                else:
                    if st.button(
                        "✅",
                        key=f"act_{uid}",
                        help=f"Activate {uname}",
                    ):
                        try:
                            api.activate_user(uid)
                            st.toast(f"User **{uname}** activated.", icon="✅")
                            refresh_users()
                            st.rerun()
                        except Exception as e:
                            st.error(f"Failed: {e}")

        st.divider()


# ---------------------------------------------------------------------------
# Reset password dialog
# ---------------------------------------------------------------------------
reset_uid = st.session_state.get("reset_pw_user_id")
reset_uname = st.session_state.get("reset_pw_username")

if reset_uid:
    st.subheader(f"🔑 Reset Password — {reset_uname}")
    with st.form("reset_pw_form"):
        st.markdown(
            "Enter a new password, or leave blank to reset to the system default "
            f"(`ChangeMe@123`). The user will be required to change it on next login."
        )
        new_pw = st.text_input(
            "New password (optional)",
            type="password",
            placeholder="Leave blank to use system default",
        )
        col_confirm, col_cancel = st.columns(2)
        with col_confirm:
            confirmed = st.form_submit_button("✅ Reset Password", use_container_width=True, type="primary")
        with col_cancel:
            cancelled = st.form_submit_button("Cancel", use_container_width=True)

    if confirmed:
        try:
            api.reset_user_password(reset_uid, new_pw if new_pw else None)
            st.success(f"Password for **{reset_uname}** has been reset. They must change it on next login.")
            st.session_state["reset_pw_user_id"] = None
            st.session_state["reset_pw_username"] = None
            st.rerun()
        except Exception as e:
            st.error(f"Failed to reset password: {e}")

    if cancelled:
        st.session_state["reset_pw_user_id"] = None
        st.session_state["reset_pw_username"] = None
        st.rerun()
