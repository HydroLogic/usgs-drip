$(function () {
  'use strict';

  var dataTable;
  var $el = $('.data-panel');
  var cols = ['title', 'ar_dam_name', 'ar_damheight_ft', 'ar_desc', 'ar_location', 'ar_river_basin', 'ar_state', 'ar_uniqueid', 'ar_yr', 'comid', 'damaccessionnumber', 'damareaofentirewatershed_km2', 'damassociatedusgsstreamgaugingstation', 'damcountry', 'damdayremovalbegan', 'damdayremovalfinished', 'damfunction', 'damgaugingstationdatayears', 'damheight_m', 'damlengthofreservoir_m', 'damlengthofstoredsedimentupstreamofdam_m', 'damlocation', 'dammonthremovalbegan', 'dammonthremovalfinished', 'dammotivationforremoval', 'damnotes', 'damnumberofdaystoremovedam', 'damoperation', 'damowner', 'damremovalmethod', 'damreservoirsurfacearea_km2', 'damreservoirvolume_m3', 'damriverannualsedimentdischarge', 'damrivermeandischarge_cms', 'damrivername', 'damriverwidthupstreamofimpoundment_m', 'damstate_province', 'damstoredreservoirsedimentvolume_m3', 'damstrahlerstreamorder', 'damupstreamdrainagearea_km2', 'damwebsite1', 'damwebsite2', 'damwebsite3', 'damwidth_m', 'damyearbuiltoriginalstructure', 'damyearbuiltremovedstructure', 'damyearremovalbegan', 'damyearremovalfinished', 'datasource_upstreamdrainagearea', 'datasource_watershedarea', 'event_currentness', 'featureuri', 'fmeas', 'gnis_name', 'nhdreg', 'nidid', 'reachcode', 'seacap_id', 'spatver', 'vernote'];
  var dtColumns = cols.map(function (col) {
    return { data: col, title: col };
  });

  amplify.subscribe('map.damsChanged', onDamsChanged);

  function onDamsChanged(dams) {
    if (dataTable) {
      // Update data.
      dataTable
        .clear()
        .rows.add(dams)
        .draw();
    } else {
      // Create table with data.
      dataTable = $el.find('table').DataTable({
        data: dams,
        columns: dtColumns,
        deferRender: true,
        scroller: true,
        searching: false,
        info: false,
        paging: true,
        pageLength: 50,
        lengthChange: false,
        scrollY: 270,
        scrollX: true
      });
    }
  }
});
