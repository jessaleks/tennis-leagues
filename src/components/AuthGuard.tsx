import { type ParentProps, Show, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { authStore } from "../stores/auth.store";

function AuthGuard(props: ParentProps) {
  const navigate = useNavigate();

  // Use createEffect to handle navigation as a side effect
  // This ensures proper timing after the component mounts
  createEffect(() => {
    if (!authStore.isAuthenticated) {
      navigate("/login");
    }
  });

  return (
    <Show when={authStore.isAuthenticated}>
      {props.children}
    </Show>
  );
}

export default AuthGuard;
