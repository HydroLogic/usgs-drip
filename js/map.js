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
  var DAM_SQL_TEMPLATE = 'select dams.*, ' +
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
    'where {{sqlWhere}}';
  var CITATION_SQL_TEMPLATE = 'select dams.damaccessionnumber, cit.* ' +
    'from clientdemos.usgs_drip_dams dams ' +
    'left outer join clientdemos.usgs_drip_accession_numbers acc ' +
    'on dams.damaccessionnumber = acc.damaccessionnumber ' +
    'left outer join clientdemos.usgs_drip_citations cit ' +
    'on cit.citationaccessionnumber = acc.citationaccessionnumber ' +
    'where dams.damaccessionnumber = {{damAccessionNumber}}';
  var damSubLayer;


  // Initialization
  // --------------

  cartodb.createVis('map', visUrl, options).done(onMapCreate);

  // Get all dams, then publish an event with them.
  getDams().then(amplify.publish.bind(null, 'map.damsChanged'));

  // CartoDB infowindows seem to prevent click event bubbling, so expose this
  // globally for infowindow templates to have access to it.
  window.loadDamCitations = loadDamCitations;


  // Functions
  // ---------

  function loadDamCitations(damAccessionNumber) {
    var $el = $('.dam-citations');
    $el.html('<i>Loading...</i>');

    getCitations(damAccessionNumber).then(function (citations) {
      var html = citationsTemplateCompiled({ citations: citations });
      $el.html(html);
    });
  }

  function getCitations(damAccessionNumber) {
    var deferred = $.Deferred();

    new cartodb.SQL({ user: 'clientdemos' })
      .execute(compileCitationSql(damAccessionNumber))
      .done(function (data) {
        deferred.resolve(data.rows);
      })
      .error(function (err) {
        console && console.error && console.error(err);
        deferred.reject(err);
      });

    return deferred.promise();
  }

  function compileCitationSql(damAccessionNumber) {
    return CITATION_SQL_TEMPLATE.replace('{{damAccessionNumber}}', damAccessionNumber);
  }

  function getDams(conditions) {
    var deferred = $.Deferred();

    new cartodb.SQL({ user: 'clientdemos' })
      .execute(compileDamSql(conditions))
      .done(function (data) {
        deferred.resolve(data.rows);
      })
      .error(function (err) {
        console && console.error && console.error(err);
        deferred.reject(err);
      });

    return deferred.promise();
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
    var sql = compileDamSql(filters);

    // Get a filtered list of dams, and publish an event with them.
    getDams(filters).then(amplify.publish.bind(null, 'map.damsChanged'));

    // Update the map.
    damSubLayer.setSQL(sql);
  }

  function compileDamSql(conditions) {
    if (!conditions) {
      // No filters were provided, so don't add any where clauses to sql.
      return DAM_SQL_TEMPLATE.replace('{{sqlWhere}}', '1=1');
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
    var sql = DAM_SQL_TEMPLATE.replace('{{sqlWhere}}', sqlWhere);

    return sql;
  }
});
