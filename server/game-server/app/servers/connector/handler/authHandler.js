module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

var handler = Handler.prototype;

handler.login = function(msg, session, next) {
  var self = this;

  var username = msg.username;

  console.log(username + ' login........');

  // room id
  var rid = '001';

  // user id
  var uid = username + '_' + rid;

  var sessionService = self.app.get('sessionService');

  // duplicate log in
  if (!!sessionService.getByUid(uid)) {
    next(null, { code: 500, error: true });
    return;
  }

  session.bind(uid);

  session.set('rid', rid);

  session.push('rid', function(err) {
    if (err) {
      console.error('set rid for session service failed! error is : %j', err.stack);
    }
  });

  //session.on('closed', onUserLeave.bind(null, self.app));

  //put user into channel
  self.app.rpc.poker.pokerRemote.add(session, uid, self.app.get('serverId'), rid, true, function(users) {
    next(null, { users: [] });
  });
};

var onUserLeave = function(app, session) {
	if(!session || !session.uid) {
		return;
	}
	app.rpc.poker.pokerRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
};