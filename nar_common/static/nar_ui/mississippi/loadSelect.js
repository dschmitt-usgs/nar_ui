var nar = nar || {};
nar.mississippi = nar.mississippi || {};

/*
 * @param map {OpenLayers.map}
 * @param filterDiv {jquery element containing the load filters }
 * @param changeHandler {function with selections object which is called whenever one of the filters changes}
 */
nar.mississippi.createLoadSelect = function(map, filterDiv, changeHandler) {
	var loadLayer = new OpenLayers.Layer.WMS(
		'Nutrient Load',
		CONFIG.endpoint.geoserver + 'NAR/wms',
		{
			transparent : true,
		},
		{
			isBaseLayer : false
		}
	);
	
	var mapHasLayer = function() {
		return (map.getLayersByName('Nutrient Load').length > 0);
	};
	map.addLayer(loadLayer);
	
	var loadSelect = filterDiv.find('select[name="load"]');
	var chemicalSelect = filterDiv.find('select[name="chemical"]');
	var yearSelect = filterDiv.find('select[name="year"]');
	
	// Enable year types to match the selected load
	loadSelect.change(function() {
		var yearType = $(this).find('option:selected').data('year');
		var rangeYearOptions = yearSelect.find('option[data-is-range="True"]');
		var discreteYearOptions = yearSelect.find('option[data-is-range="False"]');
		
		if (yearType === 'range') {
			rangeYearOptions.removeAttr('disabled');
			discreteYearOptions.attr('disabled', 'disabled');
			if (yearSelect.find('option:selected').data('is-range') === 'False') {
				yearSelect.val('');
			}
		}
		else {
			rangeYearOptions.attr('disabled', 'disabled');
			discreteYearOptions.removeAttr('disabled');
			if (yearSelect.find('option:selected').data('is-range') === 'True') {
				yearSelect.val('');
			}
		}
		
	});
	
	filterDiv.find('select').change(function() {
		var load = loadSelect.val().split('_');
		var chemical = chemicalSelect.val();
		var year = yearSelect.val();
		if (load.length > 0 && chemical && year) {
			loadLayer.mergeNewParams({
				layers : 'NAR:missrivout_' + year,
				styles : chemical + '_' + load[load.length - 1]
			});
			loadLayer.setVisibility(true);
		}
		else {
			loadLayer.setVisibility(false);
		}
		changeHandler({
			parameter_type : load.last(), 
			constituent : chemical,
			water_year : year
		});
	});
		
};