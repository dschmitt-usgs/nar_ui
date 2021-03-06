//@requires nar.util, nar.WaterYearUtils
var nar = nar || {};
(function(){
nar.timeSeries = nar.timeSeries || {};

/**
 * @typedef nar.timeSeries.TimeSeriesConfig
 * @property {String} observedProperty - a full url identifier for an SOS observedProperty
 * @property {String} procedure - a full url identifier for an SOS procedure
 * @property {String} featureOfInterest - the sos feature of interest
 * @property {nar.timeSeries.TimeRange} timeRange
 */

/**
 * @class
 * @param {nar.timeSeries.TimeSeriesConfig} config
 */
nar.timeSeries.TimeSeries = function(config){
    var self = this;
    self.procedure= config.procedure;
    self.observedProperty = config.observedProperty;
    self.timeRange = config.timeRange || null;
    self.featureOfInterest = config.featureOfInterest;
    self.data = undefined;
    
    self.parseSosGetResultResponse = function(response){
        var errorMessage ='error retrieving data';
        var dataToReturn = null;
        if(response.exception){
            console.dir(response.exception);
            alert(errorMessage);
        }
        else{
            if(response.resultValues){
                var rows = response.resultValues.split('@');
                //the first row is just the record count. Throw it away.
                rows = rows.from(1);
                var dateIndex = 0;
                var rowSplitToken = ',';
                dataToReturn = rows.map(function(row){
                    var tokens = row.split(rowSplitToken);
                    var timeStamp = Date.create(tokens[dateIndex]).getTime();
                    //overwrite
                    tokens[dateIndex] = timeStamp;
                    return tokens;
                });
            }
            else{
                console.dir(response);
                alert(errorMessage);
            }
        }
        return dataToReturn;
    };
    /**
     * Retrieve data and run callback. Does not check to see if data is already present.
     * @returns {jQuery.promise} -- the promise callbacks are called with this TimeSeries
     */
    self.retrieveData = function(){
        var getResultParams = {
            "request": "GetResult",
            "service": "SOS",
            "version": "2.0.0",
            "offering" : self.procedure,
            "observedProperty" : self.observedProperty,
            "featureOfInterest" : self.featureOfInterest,
        };
        if (self.timeRange) {
			getResultParams.temporalFilter = [ {
				"during" : {
					"ref" : "om:phenomenonTime",
					"value" : [
						nar.util.toISOString(self.timeRange.startTime),
						nar.util.toISOString(self.timeRange.endTime) 
					]
				}
			} ];
		}
        
        var deferred = $.Deferred();

        var dataRetrieval = $.ajax({
            url: CONFIG.endpoint.sos + '/json',
            type: 'POST',
            data: JSON.stringify(getResultParams),
            contentType:'application/json',
            success: function(response, textStatus, jqXHR){
                self.data = self.parseSosGetResultResponse(response);
                if (!self.timeRange) {
                    self.timeRange = new nar.timeSeries.TimeRange(self.data[0] [0], self.data[self.data.length - 1] [0]);
                }
                // pass this entire object to the callback
                deferred.resolve(self);
            },
            error: function(data, textStatus, jqXHR){
                deferred.reject(data);
            }
        });
        var promise = deferred.promise();
        return promise;
    };
    
};

nar.timeSeries.DataAvailabilityTimeRange = function(dataAvailability, useOriginalTimes) {
    var startTimeIndex = 0;
    var endTimeIndex = 1;
    var timeRange = new nar.timeSeries.TimeRange(
        dataAvailability.phenomenonTime[startTimeIndex],
        dataAvailability.phenomenonTime[endTimeIndex]
    );
    
    // Unless otherwise specified, cut off the start date to the
    if (!useOriginalTimes) {
    	timeRange.trimStartTime();
        timeRange.trimEndTime();
    }
    
    return timeRange;
};

nar.timeSeries.MostRecentWaterYearTimeRange = function(dataAvailability) {
    var dataRange = nar.timeSeries.DataAvailabilityTimeRange(dataAvailability);
    var wy = nar.WaterYearUtils.convertDateToWaterYear(Date.create());
    while (!dataRange.contains(nar.WaterYearUtils.getWaterYearEnd(wy))) {
        wy = wy - 1;
        if (wy < 2000) {
            throw Error("No data available for recent year's data");
        }
    }
    
    // Back up and forward just a bit because during is not inclusive
    var startTime = nar.WaterYearUtils.getWaterYearStart(wy, true).rewind('1 minute');
    var endTime = nar.WaterYearUtils.getWaterYearEnd(wy, true).advance('1 minute');
    var yearRange = new nar.timeSeries.TimeRange(
        startTime,
        endTime
    );
    return yearRange;
};

}());
