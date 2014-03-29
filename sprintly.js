var request = require('request'),
    Sly;

Sly = (function() {
  function Sly(user, pass) {
    this.auth = {
      user: user,
      pass: pass
    };
  }

  /*
   * Generic request wrapper
   * @param {String} path - API path to call
   * @param {Function} cb - will be given error and JSON body
   */
  Sly.prototype.callAPI = function(path, qs, method, cb) {
    if (cb === undefined) {
      if (method === undefined) {
        cb = qs;
        qs = {};
        method = 'GET';

      } else {
        cb = method;
        method = 'GET';
      }
    }

    request({
      uri: 'https://sprint.ly/api/' + path + '.json',
      qs: qs,
      method: method,
      auth: this.auth,
      json: true
    }, function(err, response, body) {
      // response is an http.IncomingMessage we're not concerned about
      cb(err, body);
    });
   };

  /*
   * Get all products for a user
   * @param {Function} cb - will be given error and products as arguments
   */
  Sly.prototype.getProducts = function(cb) {
    this.callAPI('products', cb);
  };

  /*
   * Get all items for a product
   * @param {Integer} productId
   * @param {Function} cb - will be given error and items as arguments
   */
  Sly.prototype.getItemsForProduct = function(productId, cb) {
    var _this = this,
        limit = 100,
        itemsForProduct = [],
        getItems;

    getItems = function(start) {
      _this.callAPI(
        'products/' + productId + '/items',
        {
          offset: start,
          limit: limit
        },
        function(err, items) {
          if (err) {
            cb(err);
          } else {
            itemsForProduct = itemsForProduct.concat(items);

            if (items.length < limit) {
              cb(err, itemsForProduct);
            } else {
              getItems(start + limit);
            }
          }
        }
      );
    };

    getItems(0);
  };

  return Sly;
})();

module.exports = Sly;
