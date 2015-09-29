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
    search: false
  };
  var infoWindowTemplate = $('#info-window-template').html();
  var SQL_TEMPLATE = 'select dams.*, ' +
    '  res.*, ' +
    '  (res.physical > 0 OR res.biological > 0 OR res.waterquality > 0) hasresults ' +
    'from clientdemos.usgs_drip_dams dams ' +
    'left outer join ' +
    '(' +
    '  select dams.damaccessionnumber res_damaccessionnumber, ' +
    '    sum(res.resultsgradient) resultsgradient, ' +
    '    sum(res.resultstotalsedimentflux) resultstotalsedimentflux, ' +
    '    sum(res.resultssedimentbudget) resultssedimentbudget, ' +
    '    sum(res.resultslongitudinalprofiles) resultslongitudinalprofiles, ' +
    '    sum(res.resultslateralprofiles) resultslateralprofiles, ' +
    '    sum(res.resultsdischarge) resultsdischarge, ' +
    '    sum(res.resultschannelhydraulics) resultschannelhydraulics, ' +
    '    sum(res.resultsgrainsizedistributions) resultsgrainsizedistributions, ' +
    '    sum(res.resultsbedload) resultsbedload, ' +
    '    sum(res.resultsknickpointheadcutmigration) resultsknickpointheadcutmigration, ' +
    '    sum(res.resultsreservoirsedimenterosion) resultsreservoirsedimenterosion, ' +
    '    sum(res.resultswatertablegroundwater) resultswatertablegroundwater, ' +
    '    sum(res.resultswaterturbidity) resultswaterturbidity, ' +
    '    sum(res.resultssuspendedsediment) resultssuspendedsediment, ' +
    '    sum(res.resultsnutrientconcentrations) resultsnutrientconcentrations, ' +
    '    sum(res.resultswatertemperature) resultswatertemperature, ' +
    '    sum(res.resultsdissolvedoxygen) resultsdissolvedoxygen, ' +
    '    sum(res.resultscontaminants) resultscontaminants, ' +
    '    sum(res.resultslidaraerialphotosdem) resultslidaraerialphotosdem, ' +
    '    sum(res.resultsfishabundancecommunitystructure) resultsfishabundancecommunitystructure, ' +
    '    sum(res.resultsfishpassage) resultsfishpassage, ' +
    '    sum(res.resultsaquaticinvertebrates) resultsaquaticinvertebrates, ' +
    '    sum(res.resultsbiofilm) resultsbiofilm, ' +
    '    sum(res.resultsdetritus) resultsdetritus, ' +
    '    sum(res.resultsstreammetabolism) resultsstreammetabolism, ' +
    '    sum(res.resultsnutrientuptakecycling) resultsnutrientuptakecycling, ' +
    '    sum(res.resultsriparianvegetation) resultsriparianvegetation, ' +
    '    sum(res.resultsbirds) resultsbirds, ' +
    '    sum(res.resultsinvasivespecies) resultsinvasivespecies, ' +
    '    sum(res.resultsfreshwatermussels) resultsfreshwatermussels, ' +
    '    sum(res.resultsmarineestuarineimpacts) resultsmarineestuarineimpacts, ' +
    '    sum(res.resultsspeciesrichnessdiversity) resultsspeciesrichnessdiversity, ' +
    '    sum(res.resultsfoodwebs) resultsfoodwebs, ' +
    '    sum(res.resultswetland) resultswetland, ' +
    '    sum(res.resultsindex_physical) physical, ' +
    '    sum(res.resultsindex_biological) biological, ' +
    '    sum(res.resultsindex_waterquality) waterquality ' +
    '  from clientdemos.usgs_drip_dams dams ' +
    '  left outer join clientdemos.usgs_drip_accession_numbers acc ' +
    '    on acc.damaccessionnumber = dams.damaccessionnumber ' +
    '  left outer join clientdemos.usgs_drip_study_results res ' +
    '    on acc.resultsid = res.resultsid ' +
    '  where dams.damaccessionnumber is not null ' +
    '  group by dams.damaccessionnumber ' +
    ') res ' +
    'on dams.damaccessionnumber = res.res_damaccessionnumber ' +
    // Where clauses are inserted by replacement here.
    'where 1=1 and {{sqlWhere}}';
  var CARTO_CSS = '#usgs_drip_dams { marker-fill-opacity: 0.9; marker-line-color: #FFF; marker-line-width: 1; marker-line-opacity: 1; marker-placement: point; marker-type: ellipse; marker-width: 10; marker-fill: #FF6600; marker-allow-overlap: true; }' +
    '#usgs_drip_dams[ar_uniqueid != null] { marker-fill: #33827e; }' +
    '#usgs_drip_dams[hasresults=false],#usgs_drip_dams[hasresults=null] { marker-fill-opacity: 0.2; marker-line-opacity: 0.2; }';
  var map, defaultLayer, activeLayer;


  // Initialization
  // --------------

  cartodb.createVis('map', visUrl, options).done(onMapCreate);

  // Get all dams, then publish an event with them.
  getDams().then(amplify.publish.bind(null, 'map.damsChanged'));


  // Functions
  // ---------

  function getDams(conditions) {
    var deferred = $.Deferred();

    new cartodb.SQL({ user: 'clientdemos' })
      .execute(compileSql(conditions))
      .done(function (data) {
        deferred.resolve(data.rows);
      });

    return deferred.promise();
  }

  function onMapCreate(vis, layers) {
    window.map = map = vis.getNativeMap();
    defaultLayer = layers[1];
    activeLayer = defaultLayer;

    activeLayer.getSubLayer(0).infowindow.set({
      template: infoWindowTemplate
    });

    amplify.subscribe('mapFilters.filtersChanged', onFiltersChanged);
  }

  function onFiltersChanged(filters) {
    var sql = compileSql(filters);

    // Get a filtered list of dams, and publish an event with them.
    getDams(filters).then(amplify.publish.bind(null, 'map.damsChanged'));

    // Update the map.
    activeLayer.getSubLayer(0).setSQL(sql);
  }

  function compileSql(conditions) {
    if (!conditions) {
      // No filters were provided, so don't add any where clauses to sql.
      return SQL_TEMPLATE.replace('{{sqlWhere}}', '1=1');
    }

    var clauses = [];

    // Convert study types filters to sql.
    var studyTypeClauses = [];
    if (conditions.studyTypes.biological) {
      studyTypeClauses.push('res.biological > 0');
    }
    if (conditions.studyTypes.physical) {
      studyTypeClauses.push('res.physical > 0');
    }
    if (conditions.studyTypes.waterquality) {
      studyTypeClauses.push('res.waterquality > 0');
    }
    if (studyTypeClauses.length) {
      clauses.push(studyTypeClauses.join(' or '));
    }

    var sqlWhere = clauses.length ? clauses.join(' and ') : '1=1';
    var sql = SQL_TEMPLATE.replace('{{sqlWhere}}', sqlWhere);

    return sql;
  }
});
