//Global Variables
var cities = {
	"Arden,DE":"39.809,-75.487",
	"Wildwood,NJ":"39,-74.82",
	"Philadelphia,PA" : "39.9526,-75.1652",
	"Chicago,IL" : "41.85,-87.65",
	"Starved Rock State Park" : "41.3131,-88.9676",
	"Bolingbrook,IL" : "41.6986,-88.0684",
	"Chicago O'Hare International Airport" : "41.9798,-87.882"
};
var city = "Arden,DE";
var NWSFORECAST = {
 	metaData: {}, //Metadata for this point goes here
	forecast: {}, //7-day forecast goes here
	hourly: {}, //Hourly Forecast goes here
	grid: {}, //GridForecast goes here
	loadMeta: function(city) {
		if (!(cities[city])) {
			alert('[' + city + '] IS NOT A KNOWN CITY.  TRY AGAIN');
		}
		else {
			$.getJSON('https://api.weather.gov/points/' + cities[city],
				function(d, s, h){NWSFORECAST.metaData = d; initFcsts(d, s, h);}
				)
			.fail(function( jqxhr, textStatus, error ) {
					var err = textStatus + ", " + error + jqxhr.textResponse;
					alert( "loadMeta Request Failed: " + err );
			});
		}
	},
	loadForecast: function(url, callback) {
		if (!(url)) {
			alert('loadForecast-No URL RECEIVED.  TRY AGAIN');
		}
		else {
			$.getJSON(url,
				function(d, s, h){NWSFORECAST.forecast = d; callback(d, s, h)}
				)
			.fail(function(h,s,e){alert('Failed in NWSFORECAST.loadForecast'); nwsAPIFail(h,s,e);});
		}
	},
	loadHourly: function(url, callback) {
		if (!(url)) {
			alert('loadHourly-No URL RECEIVED.  TRY AGAIN');
		}
		else {
			$.getJSON(url,
				function(d, s, h){NWSFORECAST.hourly = d; callback(d, s, h)}
				)
			.fail(function(h,s,e){alert('Failed in NWSFORECAST.loadHourly'); nwsAPIFail(h,s,e);});
		}
	},
	loadGrid: function(url, callback) {
		if (!(url)) {
			alert('loadGrid-No URL RECEIVED.  TRY AGAIN');
		}
		else {
			$.getJSON(gridFcstUrl,
				function(d, s, h){NWSFORECAST.grid = d; callback(d, s, h)}
				)
			.fail(function(h,s,e){alert('Failed in NWSFORECAST.loadGrid'); nwsAPIFail(h,s,e);});
		}
	}
};
function initFcsts(data, status, xhdr) {
	$('title').html(city + ' Weather Forecast');
	//console.log('in initFcsts: ' + xhdr.responseText);
	NWSFORECAST.loadForecast(data.properties.forecast, processForecast);
	NWSFORECAST.loadHourly(data.properties.forecastHourly, processHourly);
	//NWSFORECAST.loadGrid(data.properties.forecastGridData, processGridFcst);
	//NWSFORECAST.loadObservationStations(data.properties.observationStations, processObs);
};

function processForecast(data, status, xhdr) {
	var html ='', thisPeriod;
	html += makeElt('div', {class: 'fcstHeadline'}, 
		  makeElt('p', {class: 'fcstCity'}, 'Forecast for: ' + city)
		+ makeElt('p', {class: 'fcstArea'}, processRelativeLocation(NWSFORECAST.metaData.properties.relativeLocation.properties))
		+ makeElt('p', {class: 'updTime'}, 'Updated: ' + new Date(data.properties.updated).toLocaleString())
	);
	for (var i=0; i<2; i++) {
		thisPeriod = data.properties.periods[i];
		html += '<div class="period">';
		html += '<p>' + thisPeriod.name + '</p>';
		html += '<img src="' + thisPeriod.icon + '"/>';
		html += '<p>' + (thisPeriod.isDaytime ? 'Hi ' : 'Low ') + thisPeriod.temperature + '&deg;' + thisPeriod.temperatureUnit + '</p>';
		html += '<p>' + thisPeriod.shortForecast + '</p>';
		html += '</div>';
	}
	$("#forecast").html(html);
};
function selHrlyPer(elt, ndx, ary, timeLims) {
	//timeLims is an array of Date objs: [startValidTime, endValidTime]
	var thisStart = new Date(elt.startTime);
	return ((thisStart >= timeLims[0]) && (thisStart < timeLims[1]));
};
function processHourly(data, status, xhdr) {
	var aryHrly, aryThisPeriod, aryNextPeriod, startTimes, nextTimes;
	var html = '';
	aryHrly = data.properties.periods.slice(0,23);
	startTimes = [new Date(NWSFORECAST.forecast.properties.periods[0].startTime), new Date(NWSFORECAST.forecast.properties.periods[0].endTime)];
	nextTimes = [new Date(NWSFORECAST.forecast.properties.periods[1].startTime), new Date(NWSFORECAST.forecast.properties.periods[1].endTime)];
	aryThisPeriod = data.properties.periods.filter(function(e,i,a){return selHrlyPer(e,i,a,startTimes);});
	aryNextPeriod = data.properties.periods.filter(function(e,i,a){return selHrlyPer(e,i,a,nextTimes);});
	console.log('In processHourly: ' + [aryThisPeriod[0].startTime, aryNextPeriod[0].startTime]);
	for (var i=0;i<24;i++) {
		var thisPeriod = data.properties.periods[i];
		html += '<img src="' + thisPeriod.icon + '" title="' + thisPeriod.shortForecast + '"/>';
	}
	$('#hourly').html(html);
};

function processRelativeLocation(locprops) {
	var rzlt = '';
	//console.log('in processRelLoc: ' + [locprops, JSON.stringify(locprops)]);
	rzlt += m2mi(locprops.distance.value) + ' mi ' + deg2compass(locprops.bearing.value)
	+ ' of ' + locprops.city + ', ' + locprops.state;
	return rzlt;
};
function m2mi(dist) {
	return Math.round( 10 * dist * 100 / 2.54 / 12 / 5280) / 10;
};
function deg2compass(brng) {
	var crose = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'], ndx;
	ndx = Math.floor(((11.25+brng) % 360) / 22.5);
	return crose[ndx];
};
function makeElt(tag, options, str) {
	var html ='';
	html += '<' + tag;
	if (options) {
		for (var attr in options) {
			html += ' ' + attr + '="' + options[attr] + '"';
		}
	}
	html += '>' + str + '</' + tag + '>';
	return html;
};
