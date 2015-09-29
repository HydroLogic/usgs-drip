/**
 * This module is responsible for updating the map based on applied filters (see map-filters.js),
 * as well as publishing events with filtered lists of dams for other components.
 *
 * Events:
 *   map.damsChanged {array[dam]}
 */
$(function () {
  'use strict';

  var visUrl = 'https://appgeo.cartodb.com/u/clientdemos/api/v2/viz/e8829dcc-615f-11e5-8e12-0e4fddd5de28/viz.json';
  var options = {
    'center_lon': -96.76,
    'center_lat': 39.16,
    zoom: 4,
    shareable: false,
    scrollwheel: true,
    search: false,
    tooltip: false
  };
  var infoWindowTemplate = $('#info-window-template').html();
  var citationsTemplateCompiled = Mustache.render.bind(null, $('#citations-template').html());
  var damSubLayer;


  // Initialization
  // --------------

  cartodb.createVis('map', visUrl, options).done(onMapCreate);

  // Get all dams, then publish an event with them.
  App.DataService.getDams().then(amplify.publish.bind(null, 'map.damsChanged'));

  // CartoDB infowindows seem to prevent click event bubbling, so expose this
  // globally for infowindow templates to have access to it.
  window.loadDamCitations = loadDamCitations;


  // Functions
  // ---------

  function loadDamCitations(damAccessionNumber) {
    var $el = $('.dam-citations');
    $el.html('<i>Loading...</i>');

    App.DataService.getCitations(damAccessionNumber).then(function (citations) {
      var html = citationsTemplateCompiled({ citations: citations });
      $el.html(html);
    });
  }

  function onMapCreate(vis, layers) {
    damSubLayer = layers[1].getSubLayer(0);

    damSubLayer.infowindow.set({
      template: infoWindowTemplate,
      sanitizeTemplate: false
    });

    amplify.subscribe('mapFilters.filtersChanged', onFiltersChanged);
  }

  function onFiltersChanged(filters) {
    var sql = App.DataService.compileDamSql(filters);

    // Get a filtered list of dams, and publish an event with them.
    App.DataService.getDams(filters).then(amplify.publish.bind(null, 'map.damsChanged'));

    // Update the map.
    damSubLayer.setSQL(sql);
  }
});
