module.exports = function(app) {
  return new PokerRemote(app);
};

var PokerRemote = function(app) {
  this.app = app;
  this.channelService = app.get('channelService');
};

/**
 * Add user into poker channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 *
 */
PokerRemote.prototype.add = function(uid, sid, name, flag, cb) {
  var channel = this.channelService.getChannel(name, flag);

  var username = uid;

  //var param = { route: 'onAdd', user: username };
  //
  //channel.pushMessage(param);

  if (!!channel) {
    channel.add(uid, sid);
  }

  cb(this.get(name, flag));
};

/**
 * Get user from chat channel.
 *
 * @param {Object} opts parameters for request
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 * @return {Array} users uids in channel
 *
 */
PokerRemote.prototype.get = function(name, flag) {
  var users = [];
  //var channel = this.channelService.getChannel(name, flag);
  //if (!!channel) {
  //  users = channel.getMembers();
  //}
  //for (var i = 0; i < users.length; i++) {
  //  users[i] = users[i].split('*')[0];
  //}
  return users;
};

PokerRemote.prototype.kick = function () {
  //var channel = this.channelService.getChannel(name, false);
  //// leave channel
  //if( !! channel) {
  //  channel.leave(uid, sid);
  //}
  //var username = uid.split('*')[0];
  //var param = {
  //  route: 'onLeave',
  //  user: username
  //};
  //channel.pushMessage(param);
  //cb();
};