/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import App from "./App";
import AuthLayout from "./components/AuthLayout";
import { GroupsList } from "./screens/GroupsList";
import { GroupView } from "./screens/GroupView";
import { Login } from "./screens/Login";
import { Signup } from "./screens/Signup";
import { CreateGroup } from "./screens/CreateGroup";
import { JoinGroup } from "./screens/JoinGroup";
import { LogMatch } from "./screens/LogMatch";
import { ConfirmMatch } from "./screens/ConfirmMatch";
import { GroupSettings } from "./screens/GroupSettings";
import { PlayerProfile } from "./screens/PlayerProfile";
import { MatchHistory } from "./screens/MatchHistory";

render(
  () => (
    <Router root={App}>
      {/* Public routes - no auth required */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      {/* Protected routes - wrapped in AuthLayout with bottom nav */}
      <Route path="/" component={AuthLayout}>
        <Route path="/" component={GroupsList} />
        <Route path="/create-group" component={CreateGroup} />
        <Route path="/join-group" component={JoinGroup} />
        <Route path="/group/:groupId" component={GroupView} />
        <Route path="/group/:groupId/log-match" component={LogMatch} />
        <Route path="/group/:groupId/confirm-match" component={ConfirmMatch} />
        <Route path="/group/:groupId/settings" component={GroupSettings} />
        <Route path="/group/:groupId/player/:playerId" component={PlayerProfile} />
        <Route path="/group/:groupId/matches" component={MatchHistory} />
      </Route>
    </Router>
  ),
  document.getElementById("root") as HTMLElement
);
