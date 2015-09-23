$(function () {
  'use strict';

  var vizUrl = 'https://appgeo.cartodb.com/u/clientdemos/api/v2/viz/e8829dcc-615f-11e5-8e12-0e4fddd5de28/viz.json';
  var options = {
    shareable: false,
    scrollwheel: true
  };

  cartodb.createVis('map', vizUrl, options);
});
