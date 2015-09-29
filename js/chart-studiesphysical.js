$(function() {

  'use strict';

  //sum added to Array.prototype to get the sum of study attributes
  Array.prototype.sum = function(prop) {
    var total = 0;
    for (var i = 0, _len = this.length; i < _len; i++) {
      total += this[i][prop];
    }
    return total;
  };

  var chart = [];

  /*array of study types: each type has a function to get study type attributes
  and a corresponding chart
  */
  var studyTypes = ['physical', 'water', 'biological'];

  amplify.subscribe('map.damsChanged', onDamsChanged);

  function onDamsChanged(dams) {
    studyTypes.forEach(function(value) {
      var array = getStudyArray(dams, value);
      var action = chart[value] ? updateChart : createChart;
      action(array, value);
    });
  }

  //Extract the study type attribute values from each dam into an array.

  function getStudyArray(dams, study) {
    var studyArray = dams.reduce(function(result, dam) {
      var studyAttributes = study === 'physical' ? getPhysicalAttribute : (study === 'water' ? getWaterAttribute : getBiologicalAttribute);
      var damAttribute = studyAttributes(dam);

      if (damAttribute) {
        result.push(damAttribute);
      }
      return result;
    }, []);

    return studyArray;
  }

  function createChart(array, study) {
    var ctx = $('#chart-studies' + study).get(0).getContext('2d');
    var arraySummaryData = getArraySummary(array);

    var chartData = {
      labels: arraySummaryData.labels,
      datasets: [{
        fillColor: '#E0BB6A',
        strokeColor: '#E0BB6A',
        data: arraySummaryData.data
      }]
    };

    chart[study] = new Chart(ctx).HorizontalBar(chartData, {
      responsive: true,
      scaleFontSize: 11,
      tooltipFontSize: 12
    });
  }

  function updateChart(array, study) {

    var dataset = chart[study].datasets[0];

    //get new summary data.
    var arraySummaryData = getArraySummary(array);

    // Reset chart values.
    dataset.bars.forEach(function(bar) {
      bar.value = 0;
    });

    // Iterate through input summaries, incrementing chart values.
    arraySummaryData.data.forEach(function(value, index) {
      dataset.bars[index].value = value;
    });

    chart[study].update();
  }

  // get summary for study type
  function getArraySummary(array) {
    var data = [];
    var labels = Object.keys(array[0]);
    labels.forEach(function(i, v) {
      data.push(array.sum(i));
    });
    return {
      labels: labels,
      data: data
    };
  }

  //attributes for physical study group
  function getPhysicalAttribute(dam) {
    return {
      'Gradient': parseInt(dam.resultsgradient) || 0,
      'Total Sediment Flux': parseInt(dam.resultstotalsedimentflux) || 0,
      'Sediment Budget': parseInt(dam.resultssedimentbudget) || 0,
      'Longitudinal Profiles': parseInt(dam.resultslongitudinalprofiles) || 0,
      'Lateral Profiles': parseInt(dam.resultslateralprofiles) || 0,
      'Discharge': parseInt(dam.resultsdischarge) || 0,
      'Channel Hydraulics': parseInt(dam.resultschannelhydraulics) || 0,
      'Grain Size Distributions': parseInt(dam.resultsgrainsizedistributions) || 0,
      'Bedload': parseInt(dam.resultsbedload) || 0,
      'Knick Point Head Cut Migration': parseInt(dam.resultsknickpointheadcutmigration) || 0,
      'Reservoir Sediment Erosion': parseInt(dam.resultsreservoirsedimenterosion) || 0,
      'Water Table Groundwater': parseInt(dam.resultswatertablegroundwater) || 0,
      'Lidar Aerial Photos Dem': parseInt(dam.resultslidaraerialphotosdem) || 0
    };
  }

  //attributes for biological study group
  function getBiologicalAttribute(dam) {
    return {
      'Fish Abundance Community Structure': parseInt(dam.resultsfishabundancecommunitystructure) || 0,
      'Fish Passage': parseInt(dam.resultsfishpassage) || 0,
      'Aquatic Invertebrates': parseInt(dam.resultsaquaticinvertebrates) || 0,
      'Biofilm': parseInt(dam.resultsbiofilm) || 0,
      'Detritus': parseInt(dam.resultsdetritus) || 0,
      'Stream Metabolism': parseInt(dam.resultsstreammetabolism) || 0,
      'Nutrient Uptake Cycling': parseInt(dam.resultsnutrientuptakecycling) || 0,
      'Riparian Vegetation': parseInt(dam.resultsriparianvegetation) || 0,
      'Birds': parseInt(dam.resultsbirds) || 0,
      'Invasive Species': parseInt(dam.resultsinvasivespecies) || 0,
      'Freshwater Mussels': parseInt(dam.resultsfreshwatermussels) || 0,
      'Marine Estuarine Impacts': parseInt(dam.resultsmarineestuarineimpacts) || 0,
      'Species Richness Diversity': parseInt(dam.resultsspeciesrichnessdiversity) || 0,
      'Food Webs': parseInt(dam.resultsfoodwebs) || 0,
      'Wetland': parseInt(dam.resultswetland) || 0
    };
  }

  //attributes for water study group
  function getWaterAttribute(dam) {
    return {
      'Water Turbidity': parseInt(dam.resultswaterturbidity) || 0,
      'Suspended Sediment': parseInt(dam.resultssuspendedsediment) || 0,
      'Nutrient Concentrations': parseInt(dam.resultsnutrientconcentrations) || 0,
      'Water Temperature': parseInt(dam.resultswatertemperature) || 0,
      'Dissolved Oxygen': parseInt(dam.resultsdissolvedoxygen) || 0,
      'Contaminants': parseInt(dam.resultscontaminants) || 0
    };
  }

});
