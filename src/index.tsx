/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import App from "./App";
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

render(
  () => (
    <Router root={App}>
      <Route path="/" component={GroupsList} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/create-group" component={CreateGroup} />
      <Route path="/join-group" component={JoinGroup} />
      <Route path="/group/:groupId" component={GroupView} />
      <Route path="/group/:groupId/log-match" component={LogMatch} />
      <Route path="/group/:groupId/confirm-match" component={ConfirmMatch} />
      <Route path="/group/:groupId/settings" component={GroupSettings} />
      <Route path="/group/:groupId/player/:playerId" component={PlayerProfile} />
    </Router>
  ),
  document.getElementById("root") as HTMLElement
);
