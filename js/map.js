$(function () {
  'use strict';

  var vizUrl = 'https://appgeo.cartodb.com/u/clientdemos/api/v2/viz/e8829dcc-615f-11e5-8e12-0e4fddd5de28/viz.json';
  var options = {
    shareable: false,
    scrollwheel: true
  };

  cartodb.createVis('map', vizUrl, options);

  // For now, trigger chart creation with a sql call here.
  var sql = new cartodb.SQL({ user: 'clientdemos' });
  sql.execute('SELECT * FROM usgs_drip_dams').done(function (data) {
    amplify.publish('map.damsChanged', data.rows);
  });
});
