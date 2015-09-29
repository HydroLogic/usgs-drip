$(function() {

  'use strict';

  var chart;

  amplify.subscribe('map.damsChanged', onDamsChanged);

  function onDamsChanged(dams) {
    var heightArray = getHeightArray(dams);
    var action = chart ? updateChart : createChart;

    action(heightArray);
  }

  /**
   * Extract the height  values from each dam into an arrray.
   */
  function getHeightArray(dams) {
    var heightArray = dams.reduce(function(result, dam) {
      var height = parseFloat(dam.ar_damheight_ft) || parseFloat(parseFloat(dam.damheight_m) * 3.28084);
      if (height) {
        result.push(height);
      }
      return result;
    }, []);

    return heightArray;
  }

  function createChart(heightArray) {
    var ctx = $('#chart-damheight').get(0).getContext('2d');
    var heightData = getHeightData(heightArray);

    var chartData = {
      labels: heightData.labels,
      datasets: [{
        fillColor: '#E0756A',
        strokeColor: '#E0756A',
        data: heightData.data
      }]
    };

    chart = new Chart(ctx).Bar(chartData, {
      responsive: true,
      scaleFontSize: 11,
      tooltipFontSize: 12
    });
  }

  function updateChart(heightArray) {
    var dataset = chart.datasets[0];

    // Return min/max values for each of the existing height range labels.
    var bins = dataset.bars.map(function(bar) {
      var label = bar.label;
      var parts = label.split('-');
      return {
        min: parseFloat(parts[0]),
        max: parseFloat(parts[1])
      };
    });

    // Create a function which given an height, can return the appropriate bar.
    var getBar = function getBar(height) {
      for (var i = 0; i < bins.length; i++) {
        var bin = bins[i];
        if (height >= bin.min && height <= bin.max) {
          return dataset.bars[i];
        }
      }
    };

    // Reset chart values.
    dataset.bars.forEach(function(bar) {
      bar.value = 0;
    });

    // Iterate through input heights, incrementing chart values.
    heightArray.forEach(function(height) {
      getBar(height).value++;
    });

    // TODO: Figure out how to fix the scale before updating the data.
    chart.update();
  }

  /**
   * Quantizes heights into ranges, an returns labels and data for building a chart of height counts.
   * @param heights {array[int]}
   * @returns {object} object with `labels` and `data` properties.
   *   labels: array of height range labels as strings.
   *   data: array of height counts for each height range.
   */
  function getHeightData(heights) {
    var sortedHeights = heights.sort(function(a, b) {
      return a > b ? 1 : a < b ? -1 : 0;
    });
    var min = sortedHeights[0];
    var max = sortedHeights[sortedHeights.length - 1];
    var labels = [];
    var data = [];

    // Get min/max values based on factor-of-10 height intervals (e.g. 1971-1990).
    var rangeMin = endsIn1(min) ? min : floor25(min - 1) + 1;
    var rangeMax = ceil25(max);

    // Determine the height range size necessary to achieve 10 or fewer groupings.
    var rangeSize = ceil25((rangeMax - rangeMin) / 10);

    // Populate label array as strings.
    // Populate data array of height counts for each height range.
    for (var i = rangeMin, j = 0; i <= rangeMax; i = i + rangeSize) {
      var labelMin = i;
      var labelMax = i + rangeSize - 1;
      var label = labelMin + '-' + labelMax;
      labels[j] = label;
      data[j] = heights.filter(inRange(labelMin, labelMax)).length;
      j++;
    }

    return {
      labels: labels,
      data: data
    };
  }

  function ceil25(num) {
    return num + (25 - (num % 25));
  }

  function floor25(num) {
    return num - (num % 25);
  }

  function endsIn1(num) {
    return ceil25(num) === (num - 1);
  }

  function inRange(min, max) {
    return function(num) {
      return num >= min && num <= max;
    };
  }

});
