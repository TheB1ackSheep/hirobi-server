var express = require('express'); // call express
var app = express(); // define our app using express
var bodyParser = require('body-parser');
var firebase = require("firebase");

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080; // set our port

var router = express.Router(); // get an instance of the express Router

var ref = new firebase("https://hirobi.firebaseio.com/");

router.get('/', function(req, res) {
  res.json({
    message: 'hooray! welcome to our api!'
  });
});

var usersRef = ref.child("/users");
var devicesRef = ref.child("/devices");

function insert(name, path, obj, cb, overwrite) {
  overwrite = typeof overwrite == 'undefined' ? false : overwrite;
  query(path, function(data) {
    if (data && overwrite === false)
      cb.call(this, {
        error: "this " + name + " is already exists."
      });
    else {
      ref.child(path).set(obj, function(error) {
        if (error)
          cb.call(this, {
            error: error
          });
        else {
          query(path, function(data) {
            cb.call(this, data);
          });
        }
      });
    }
  });
}

function update(path, obj, cb) {
  query(path, function(data) {
    if (data)
      ref.child(path).update(obj, function(error) {
        if (error)
          cb.call(this, {
            error: error
          });
        else {
          query(path, function(data) {
            cb.call(this, data);
          });
        }
      });
  });
}

function remove(path, cb) {
  ref.child(path).remove(function(error) {
    if (error)
      cb.call(this, {
        error: error
      });
    else
      cb.call(this, {
        success:""
      });
  });
}

function query(child, cb) {
  ref.child(child).once('value', function(snapshot) {
    cb.call(this, snapshot.val());
  });
}

router.post('/devices', function(req, res) {
  var device = {
    api_level: req.body.api_level,
    model: req.body.model
  };
  insert('device', '/devices/' + req.body.id, device,
    function(data) {
      res.json(data)
    });
});

router.post('/users', function(req, res) {
  var user = {};
  user[req.body.name.toLowerCase()] = {
    avatar: req.body.avatar,
    device_id: req.body.device_id,
    display_name: req.body.name
  };
  insert('user', '/users/', user,
    function(data) {
      res.json(data)
    });
});

router.put('/users/:name', function(req, res) {
  var user = {}
  if (req.body.name) user.display_name = req.body.name;
  if (req.body.avatar) user.avatar = req.body.avatar;
  update('/users/' + req.params.name.toLowerCase(), user,
    function(data) {
      res.json(data);
    });

});

router.delete('/users/:name', function(req, res) {
  remove('/users/' + req.params.name, function(data) {
    res.json(data);
  });
});

app.use('/api', router);

app.listen(port);
console.log('Magic happens on port ' + port);