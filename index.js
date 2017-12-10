var level = require("level-browserify");
var sub = require("subleveldown");
var db = level("wiki.db");
var hyperlog = require("hyperlog");
var log = hyperlog(sub(db, "log"), { valueEncoding: "json" });
var html = require("yo-yo");
var hyperkv = require("hyperkv");
var kv = hyperkv({ log: log, db: sub(db, "kv") });
var to = require("to2");
var rows = [];
var root = document.body.appendChild(document.createElement("div"));
var docs = {};

var wswarm = require("webrtc-swarm");
var signalhub = require("signalhub");

var swarm = wswarm(signalhub("will", ["https://signalhub-jccqtwhdwc.now.sh"]));
swarm.on("peer", function(peer, id) {
  console.log("PEER", id);
  peer.pipe(log.replicate({ live: true })).pipe(peer);
});
update();
getlist();
setInterval(function() {
  getlist();
}, 1000);
rows.push({
  id: "fakeId",
  test: "nom",
  message: "message"
});
function update() {
  html.update(
    root,
    html`
    <div>
        ${rows.map(r => Message(r))}
        <form onsubmit=${onsubmit}>
        <div><input name="title"></div>
        <div><textarea name="content"></textarea></div>
        </form>
    </div>`
  );
  function onsubmit(ev) {
    ev.preventDefault();
    var title = this.elements.title.value;
    var content = this.elements.content.value;
    kv.put(title, { body: content }, function(err, node) {
      if (err) return console.error(err);
    });
    this.reset();
  }
}
function Message(msg) {
  return `<div key=${msg.id}>
          ${msg.author} : ${msg.message}
        </div>`;
}

function getlist() {
  kv.createReadStream().pipe(
    to.obj(function(row, enc, next) {
      console.log("row=", row);
      update();
      if (rows.every(r => row.links[0] !== r.id)) {
        var message;
        Object.keys(row.values).forEach(
          key => (message = row.values[key].value.body)
        );
        rows.push({
          author: row.key,
          message,
          id: row.links[0]
        });
      }
      next();
    })
  );
}
