var express = require('express'),
    Step = require('step'),
    Sly = require('./sprintly'),
    app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
});

app.get('/', function(req, res) {
  res.render("index");
});

app.post('/tags', function(req, res) {
  var slyApi = new Sly(req.body.email, req.body.api_key),
      products = {},
      uniqTags = {},
      totalTags = 0;

  Step(
    function () {
      slyApi.getProducts(this);
    },
    function (err, prods) {
      if (err) return res.send(500, err);

      var group = this.group();
      prods.forEach(function(product) {
        if (!product.archived) {
          products[product.id] = {
            name: product.name,
            tags: {},
            itemCount: 0,
            statuses: {},
            types: {}
          };
          slyApi.getItemsForProduct(product.id, group());
        }
      });
    },
    function (err, itemsByProduct) {
      if (err) return res.send(500, err);

      itemsByProduct.forEach(function(items) {
        items.forEach(function (item) {
          var p = products[item.product.id];

          p.itemCount++;

          if (!p.statuses[item.status]) p.statuses[item.status] = {};
          p.statuses[item.status][item.type] = p.statuses[item.status][item.type] ? ++p.statuses[item.status][item.type] : 1;

          item.tags.forEach(function(tag) {
            totalTags++;
            uniqTags[tag] = 1;
            p.tags[tag] = p.tags[tag] ? ++p.tags[tag] : 1;
          });
        });
      });

      // Sort tags by most commonly occurring
      var srt = function(a, b) { return b[1] - a[1];};

      for (var p in products) {
        var sortable = [];
        for (var t in products[p].tags)
          sortable.push([t, products[p].tags[t]]);

        sortable.sort(srt);
        products[p].tags = sortable;
      }

      res.render("tags", {
        products : products,
        unique: Object.keys(uniqTags).length,
        total: totalTags
      });
    }
  );
});

app.listen(process.env.PORT || 3000);
