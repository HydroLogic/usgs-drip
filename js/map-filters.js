/**
 * This module is responsible for handling filter changes and publishing an event
 * describing the current filter state.
 *
 * Events:
 *   mapFilters.filtersChanged {object}
 */
$(function () {
  'use strict';

  var filters = {
    studyTypes: {}
  };

  $('#map-filters input[name="studytype"]').on('change', onChangeStudyTypes);

  function onChangeStudyTypes() {
    var $inputs = $('#map-filters input[name="studytype"]');
    var studyTypes = {
      biological: false,
      physical: false,
      waterquality: false
    };

    // Get study type values from DOM and populate t/f dictionary.
    $inputs.each(function (i, el) {
      var $el = $(el);
      var type = $el.val();
      var isChecked = $el.is(':checked');
      studyTypes[type] = isChecked;
    });

    filters.studyTypes = studyTypes;

    amplify.publish('mapFilters.filtersChanged', filters);
  }

});
