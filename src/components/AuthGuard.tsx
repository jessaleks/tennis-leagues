import { type ParentProps, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { authStore } from "../stores/auth.store";

function AuthGuard(props: ParentProps) {
  const navigate = useNavigate();

  return (
    <Show
      when={authStore.isAuthenticated}
      fallback={
        (navigate("/login"), null)
      }
    >
      {props.children}
    </Show>
  );
}

export default AuthGuard;
