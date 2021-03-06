//@requires nar.timeSeries.TimeSeries
var nar = nar || {};
nar.timeSeries = nar.timeSeries || {};
/**
 * @class
 */
nar.timeSeries.Collection = function(){
    var self = this;
    var timeSeries = [];
    
    //date range is calculated when dirty (after adding new time series)
    var dirty = true;
    var cachedTimeRange;
    
    /**
     * A wrapper around sugarjs' map function
     */
    self.map = function(customFunction){
        return timeSeries.map(customFunction);
    };
    /**
     * Asynchronously retrieves the data for all time series
     * and passes all time series objects to the success callback.
     * 
     * @returns {array<jQuery.Promise>}
     * @see http://api.jquery.com/jquery.when/
     * @see https://api.jquery.com/jQuery.deferred/
     */
    self.retrieveData = function(){
        retrievalPromises = self.map(function(timeSeries){
            return timeSeries.retrieveData();
        });
        return retrievalPromises;
    };
    
    /**
     * WARNING - Do not add elements to the returned array
     * If you do, getTimeRange will not behave properly.
     * To add elements, use self.add
     */
    self.getAll = function(){
        return timeSeries;
    };
    /**
     * 
     * @param {nar.timeSeries.TimeSeries} aTimeSeries
     */
    self.add = function(aTimeSeries){
        timeSeries.push(aTimeSeries);
        dirty = true;
    };

    /**
     * Returns the time range for a collection of time series.
     * 
     * If no time series have been added since the last time range
     * calculation, it returns the cached time range.
     * If time series have been added since the last time range
     * calculation, it calculates the new time range and caches the
     * result.
     * 
     * @returns {nar.timeSeries.TimeRange}
     */
    self.getTimeRange = function(){
        if(dirty && 0 !== timeSeries.length){
            var timeRanges = timeSeries.map(function(aTimeSeries){return aTimeSeries.timeRange;});
            cachedTimeRange = nar.timeSeries.TimeRange.ofAll(timeRanges); 
            dirty=false;
        }
        return cachedTimeRange.clone();
    };
    
    /**
     * @param {string} observedProperty
     * @returns {nar.timeSeries.TimeSeries}
     */
    self.getTimeSeriesByObservedProperty = function(observedProperty){
        var targetTimeSeries = timeSeries.find(function(potentialTimeSeries){
            return potentialTimeSeries.observedProperty === observedProperty;
        });
        return targetTimeSeries;
    };
};