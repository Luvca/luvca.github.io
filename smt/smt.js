'use strict';

var smt = smt || {};

(function (smt, undefined) {
  var container = {};

  firebase.initializeApp({
    projectId: 'fruit-basket-data',
    apiKey: 'AIzaSyB7G3nC8SOm2nb-l7hNXIJVtSbMkcGSzq0',
    authDomain: 'fruit-basket-data.firebaseapp.com'
  });

  var debug = false;
  if (!debug) {
    smt.db = firebase.firestore();
  } else {
    smt.db = {};
    smt.db.collection = function(type) {
      return {
        get: function() {
          return {
            then: function(callback) {
              console.log('1' + type);
              var result;
              if (type === 'types') {
                result = [
                  {id: 'photo'}
                ];
              } else if (type === 'albums') {
                result = [];
              } else if (type === 'tags') {
                result = [];
              } else if (type === 'posts') {
                result = [];
              }
              callback(result);
            }
          }
        },
        orderBy: function() {
          return {
            get: function() {
              return {
                then: function() {
                  console.log('2' + type);
                  return {
                    catch: function() {
                    }
                  }
                }
              }
            },
            limit: function () {
              return {
                get: function() {
                  return {
                    then: function(callback) {
                      callback({
                        docs: [
                          {
                            id: 'fujiko',
                            data: function() {
                              return {
                                title: 'DD54',
                                urls: ['img/DD54.jpg'],
                                type: 'photo'
                              }
                            }
                          }, {
                            id: 'shizuka',
                            data: function() {
                              return {
                                title: 'ED70',
                                urls: ['img/ED70.jpg'],
                              }
                            }
                          }, {
                            data: function() {
                              return {
                                title: 'EB10',
                                urls: ['img/EB10.jpg'],
                              }
                            }
                          }, {
                            data: function() {
                              return {
                                title: 'ヨ9000',
                                urls: ['img/yo9000.jpg'],
                              }
                            }
                          }
                        ]
                      });
                      return {
                        catch: function() {
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        limit: function() {
          return {
            get: function() {
  
            }
          }
        }
      }
    };
  }
  smt.settings = {};
  smt.clipboard = [];
  smt.opacity = 0;

  smt.setSettings = function(settings) {
    smt.settings = settings;
  };

  smt.import = function (name) {
    var factory = container[name];
    if (!factory) throw new Error("module is not found. name=[" + name + "]");
    return factory(this);
  }

  smt.export = function (name, factory) {
    if (container[name]) throw new Error("modle is already registered. name=" + name);
    if (!factory) throw new Error("parameter of factory is required.");

    container[name] = factory;
  };
}(smt));
