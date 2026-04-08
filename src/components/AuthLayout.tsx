import { type ParentProps } from "solid-js";
import { useNavigate, useLocation } from "@solidjs/router";
import { A } from "@solidjs/router";
import { authStore } from "../stores/auth.store";
import "./AuthLayout.css";

function AuthLayout(props: ParentProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Check auth on mount and location change
  if (!authStore.isAuthenticated) {
    navigate("/login");
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div class="auth-layout">
      <main class="auth-layout__content">
        {props.children}
      </main>
      <nav class="auth-layout__bottom-nav">
        <A href="/" class={`auth-layout__nav-item ${isActive("/") ? "auth-layout__nav-item--active" : ""}`}>
          <span class="auth-layout__nav-icon">🏠</span>
          <span class="auth-layout__nav-label">Groups</span>
        </A>
        <A href="/create-group" class={`auth-layout__nav-item ${isActive("/create-group") ? "auth-layout__nav-item--active" : ""}`}>
          <span class="auth-layout__nav-icon">➕</span>
          <span class="auth-layout__nav-label">Create</span>
        </A>
        <A href="/settings" class={`auth-layout__nav-item ${isActive("/settings") ? "auth-layout__nav-item--active" : ""}`}>
          <span class="auth-layout__nav-icon">⚙️</span>
          <span class="auth-layout__nav-label">Settings</span>
        </A>
      </nav>
    </div>
  );
}

export default AuthLayout;
