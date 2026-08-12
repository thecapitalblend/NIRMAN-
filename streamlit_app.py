import streamlit as st
from database.database import init_db
from pages.dashboard import render_dashboard
from pages.sites import render_sites
from pages.workers import render_workers
from pages.attendance import render_attendance
from pages.payments import render_payments
from pages.owners import render_owners
from pages.expenses import render_expenses
from pages.reports import render_reports
from pages.settings import render_settings

st.set_page_config(
    page_title="Balaji Construction AI",
    page_icon="🏗️",
    layout="wide",
    initial_sidebar_state="expanded",
)

init_db()

st.sidebar.title("🏗️ Balaji Construction AI")
st.sidebar.caption("Phase 1 • Construction Management")

pages = {
    "🏠 Dashboard": render_dashboard,
    "🏗️ Sites": render_sites,
    "👷 Workers": render_workers,
    "📅 Attendance": render_attendance,
    "💰 Payments": render_payments,
    "👤 Owners / Clients": render_owners,
    "💸 Expenses": render_expenses,
    "📊 Reports": render_reports,
    "⚙️ Settings": render_settings,
}

selection = st.sidebar.radio("Navigation", list(pages.keys()))
st.sidebar.divider()
st.sidebar.caption("Phase 1 foundation")
pages[selection]()
