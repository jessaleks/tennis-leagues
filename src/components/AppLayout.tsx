import { type ParentProps } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import "./AppLayout.css";

function AppLayout(props: ParentProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div class="app-layout">
      <main class="app-layout__content">
        {props.children}
      </main>
      <nav class="app-layout__bottom-nav">
        <A href="/" class={`app-layout__nav-item ${isActive("/") ? "app-layout__nav-item--active" : ""}`}>
          <span class="app-layout__nav-icon">🏠</span>
          <span class="app-layout__nav-label">Groups</span>
        </A>
        <A href="/create-group" class={`app-layout__nav-item ${isActive("/create-group") ? "app-layout__nav-item--active" : ""}`}>
          <span class="app-layout__nav-icon">➕</span>
          <span class="app-layout__nav-label">Create</span>
        </A>
        <A href="/settings" class={`app-layout__nav-item ${isActive("/settings") ? "app-layout__nav-item--active" : ""}`}>
          <span class="app-layout__nav-icon">⚙️</span>
          <span class="app-layout__nav-label">Settings</span>
        </A>
      </nav>
    </div>
  );
}

export default AppLayout;
