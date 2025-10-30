## API Mapping

### Authentication (`auth.ts`)
- `POST /api/auth/signup` → `mutation.auth.signup`
- `POST /api/auth/login` → `mutation.auth.login`
- `GET /api/auth/me` → `query.auth.getMe`

### Teams (`teams.ts`)
- `POST /api/teams` → `mutation.teams.createTeam`
- `POST /api/teams/{id}/join` → `mutation.teams.requestJoinTeam`
- `GET /api/teams/{id}` → `query.teams.getTeam`
- `GET /api/teams/my/team` → `query.teams.getMyTeam`
- `GET /api/teams/{id}/members` → `query.teams.getTeamMembers`
- `GET /api/teams/{id}/join-requests` → `query.teams.getTeamJoinRequests`
- `POST /api/teams/{id}/join-requests/{rid}/accept` → `mutation.teams.acceptJoinRequest`
- `POST /api/teams/{id}/join-requests/{rid}/reject` → `mutation.teams.rejectJoinRequest`
- `POST /api/teams/leave` → `mutation.teams.leaveTeam`
- `DELETE /api/teams/{id}` → `mutation.teams.deleteTeam`
- `DELETE /api/teams/{id}/members/{uid}` → `mutation.teams.removeTeamMember`
- `GET /api/teams/by-invite/{code}` → `query.teams.getTeamByInviteCode`

### Game (`game.ts`)
- `GET /api/rooms` → `query.game.getRooms`
- `GET /api/rooms/{id}` → `query.game.getRoom`
- `POST /api/puzzles/{id}/submit` → `mutation.game.submitFlag`
- `POST /api/clues/{id}/buy` → `mutation.game.buyClue`
- `GET /api/perks` → `query.game.getPerks`
- `POST /api/perks/{id}/buy` → `mutation.game.buyPerk`
- `POST /api/actions` → `mutation.game.performAction`
- `GET /api/leaderboard` → `query.game.getLeaderboard`
- `POST /api/rooms/{id}/unlock` → `mutation.game.unlockRoom`

### Admin (`admin.ts`)
- `POST /api/admin/rooms` → `mutation.admin.createRoom`
- `PUT /api/admin/rooms/{id}` → `mutation.admin.updateRoom`
- `DELETE /api/admin/rooms/{id}` → `mutation.admin.deleteRoom`
- `POST /api/admin/puzzles` → `mutation.admin.createPuzzle`
- `PUT /api/admin/puzzles/{id}` → `mutation.admin.updatePuzzle`
- `DELETE /api/admin/puzzles/{id}` → `mutation.admin.deletePuzzle`
- `POST /api/admin/clues` → `mutation.admin.createClue`
- `POST /api/admin/teams/override-progress` → `mutation.admin.overrideTeamProgress`
- `POST /api/admin/teams/{id}/refund` → `mutation.admin.refundPoints`
- `POST /api/admin/teams/{id}/disable` → `mutation.admin.disableTeam`
- `DELETE /api/admin/teams/{id}` → `mutation.admin.deleteTeamAdmin`
- `GET /api/admin/logs` → `query.admin.getLogs`
- `GET /api/admin/teams` → `query.admin.getAllTeams`