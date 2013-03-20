var express = require('express'),
    request = require('request'),
    Step = require('step'),
    app = express(),
    slyAPI = 'https://sprint.ly/api/';

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
});

app.get('/', function(req, res) {
  res.render("index");
});

app.post('/tags', function(req, res) {
  var slyAuth = {
          user: req.body.email,
          pass: req.body.api_key
        },
      products = {},
      totalTags = 0;

  Step(
    function getProducts() {
      request({
        uri: slyAPI + 'products.json',
        auth: slyAuth,
        json: true
      }, this);
    },
    function getItemsFromProducts(err, response, body) {
      if (err) res.send(500, err);

      var group = this.group();
      body.forEach(function(product) {
        if (product.archived === false) {
          products[product.id] = { name: product.name, tags: {} };
          request({
            uri: slyAPI + '/products/' + product.id + '/items.json',
            auth: slyAuth
          }, group());
        }
      });
    },
    function sendItems(err, itemResponses) {
      if (err) res.send(500, err);

      itemResponses.forEach(function(resp) {
        var items = JSON.parse(resp.body);

        items.forEach(function (item) {
          item.tags.forEach(function(tag) {
            totalTags++;

            if (products[item.product.id].tags.hasOwnProperty(tag)) {
              products[item.product.id].tags[tag]++;
            } else {
              products[item.product.id].tags[tag] = 1;
            }
          });
        });
      });

      for (var p in products) {
        var sortable = [];
        for (var t in products[p].tags)
          sortable.push([t, products[p].tags[t]]);

        sortable.sort(function(a, b) { return b[1] - a[1]});
        products[p].tags = sortable;
      }

      res.render("tags", { 
        products : products,
        total: totalTags
      });
    }
  );
});

app.listen(3000);
console.log("Started server...");