//Global Variables
var cities = {
	"Arden,DE":"39.809,-75.487",
	"Wildwood,NJ":"39,-74.82",
	"Philadelphia,PA" : "39.9526,-75.1652",
	"Chicago,IL" : "41.85,-87.65",
	"Starved Rock State Park" : "41.3131,-88.9676",
	"Bolingbrook,IL" : "41.6986,-88.0684",
	"Chicago O'Hare International Airport" : "41.9798,-87.882",
	"Seattle,WA" : "47.6062095,-122.3320708",
	"Houston,TX": "29.7632836,-95.3632715",
	"New Orleans,LA": "29.9546482,-90.075072"
};
var city = "Seattle,WA";
var NWSFORECAST = {
 	metaData: {}, //Metadata for this point goes here
	forecast: {}, //7-day forecast goes here
	hourly: {}, //Hourly Forecast goes here
	grid: {}, //GridForecast goes here
	observationStations: {}, //ObservationStations go here
	currentObs: {}, //current observation data here
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
	loadObservationStations: function(url, callback) {
		if (!(url)) {
			alert('loadObservationStations-No URL RECEIVED.  TRY AGAIN');
		}
		else {
			$.getJSON(url,
				function(d, s, h){NWSFORECAST.observationStations = d; callback(d, s, h)}
				)
			.fail(function(h,s,e){alert('Failed in NWSFORECAST.loadObservationStations'); nwsAPIFail(h,s,e);});
		}
	},
	loadGrid: function(url, callback) {
		if (!(url)) {
			alert('loadGrid-No URL RECEIVED.  TRY AGAIN');
		}
		else {
			$.getJSON(url,
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
	NWSFORECAST.loadObservationStations(data.properties.observationStations, processObs);
};

function processObs(data, status, xhdr) {
	console.log('Got to processObs: ' + data.observationStations[0]);
	$.getJSON(data.observationStations[0]+'/observations/current',
		function(d, s, h){NWSFORECAST.currentObs = d; displayCurrObs(d, s, h)}
		)
	.fail(function(h,s,e){alert('Failed in processObs'); nwsAPIFail(h,s,e);});
};
function displayCurrObs(data, status, xhdr) {
	console.log('got to displayCurrObs: ' + data.id);
};

function processForecast(data, status, xhdr) {
	var html ='', thisPeriod;
	html += makeElt('div', {class: 'fcstHeadline'}, 
		  makeElt('p', {class: 'fcstCity'}, 'Forecast for: ' + city)
		+ makeElt('p', {class: 'fcstArea'}, processRelativeLocation(NWSFORECAST.metaData.properties.relativeLocation.properties))
		+ makeElt('p', {class: 'updTime'}, 'Updated: ' + new Date(data.properties.updated).toLocaleString())
	);
	html += '<table width="1000"><tr>';
	for (var i=0; i<5; i++) {
		thisPeriod = data.properties.periods[i];
		html += '<td class="period">';
		html += '<p>' + thisPeriod.name + '</p>';
		html += '<img src="' + thisPeriod.icon + '"/>';
		html += '<p>' + (thisPeriod.isDaytime ? 'Hi ' : 'Low ') + thisPeriod.temperature + '&deg;' + thisPeriod.temperatureUnit + '</p>';
		html += '<p>' + thisPeriod.shortForecast + '</p>';
		html += '</td>';
	}
	html += '</tr></table>';
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
	var myChart, chartHeight, chartWidth;
	chartWidth = 1000;
	chartHeight = 200;
	//function Chart(width, height, leftPad, rightPad, topPad, bottomPad)
	myChart = new Chart(chartWidth, chartHeight, 50, 50, 50, 30);
	html += '<div style="/* border:2pt solid blue; */">';
	html += makeHrlyChart(data.properties.periods.slice(0,24), myChart);
	html += '</div>';
	$('#hourly').html(html);
};
function makeHrlyChart(data, chart) {
	var html = '';
	var minTime, maxTime, minTemp, maxTemp, sortedTemps;
	minTime = new Date(data[0].startTime);
	maxTime = new Date(data[data.length-1].startTime);
	chart.xMin = minTime.getTime();
	chart.xRange = maxTime-minTime;
	sortedTemps = data.slice().sort(function(a,b){return (a.temperature - b.temperature)});
	minTemp = sortedTemps[0].temperature;
	maxTemp = sortedTemps[sortedTemps.length-1].temperature;
	chart.yMin = minTemp - (minTemp % 5);
	chart.yRange = (maxTemp + ( 5 - (maxTemp % 5))) - chart.yMin;
	html += '<svg version="1.1" width="' + chart.width + '" height="' + chart.height + '">';
/* 	html += SVG.path({
		fill: 'none', stroke: 'red', 'stroke-width': '2pt',
		d: 'M' + chart.xAxOrig + ',' + chart.yAxOrig + ' l' + chart.xAxLen + ',' + 0
		+ 'M' + chart.xAxOrig + ',' + chart.yAxOrig + ' l' + 0 + (-1 * chart.yAxLen)
	}); */
	html += SVG.path({
		fill: 'none', stroke: 'blue',
		d: data.map(function(e,i,a){
		return chart.plotHrlyData(e,i,a,function(i){return (i==0)?'M':'L';})}).join(' ')
	});
	html += data.map(function(e,i,a){return labelTempLine(e,i,a,chart)}).join('');
	html += data.map(function(e,i,a){return labelChartHrs(e,i,a,chart)}).join('');
	html += data.map(function(e,i,a){return addChartIcons(e,i,a,chart)}).join('');
	html += '</svg>';
	return html;
};

function addChartIcons(elt, ndx, ary, chart) {
	var html = '';
	var iconWidth = 36, iconHeight = 36, iconId = 'icon' + elt.number;
	var x = chart.xpos(new Date(elt.startTime) - (moment.duration('PT30M').asMilliseconds()));
	var y = chart.topPad-(iconHeight-1);
	html += '<image id="' + iconId + '" href="' + elt.icon + '" width="' + iconWidth + '" height="' + iconHeight
		+ '" x="' + x + '" y="' + y + '"'
		+ '/>';
	html += SVG.text({
		stroke: 'none', fill: 'black', 'text-anchor': 'middle', 'font-size': '9pt',
		x: x+(iconWidth/2), y: (y + iconHeight),
		dy: '1em',
		visibility: 'hidden',
		text: '<set attributeName="visibility" to="visible" '
			+ 'begin="' + iconId + '.mouseover" end="' + iconId + '.mouseout"/>'
			+ elt.shortForecast
	});
	return html;
};
function labelChartHrs(elt, ndx, ary, chart) {
	var html = '';
	html += SVG.text({
		x: chart.xpos(new Date(elt.startTime)),
		y: chart.topPad-36,
		stroke: 'none', fill: 'black', 'text-anchor': 'middle', 'font-size': '9pt',
		text: moment.tz(elt.startTime, NWSFORECAST.metaData.properties.timeZone).format('h A')
	});
	return html;
};
function labelTempLine(elt, ndx, ary, chart) {
	var html = '';
	html += SVG.text({
		x: chart.xpos(new Date(elt.startTime)),
		y: chart.ypos(elt.temperature),
		stroke: 'none', fill: 'brown', 'text-anchor': 'middle',
		text: elt.temperature+'&deg;'
	});
	return html;
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
	if (str) { html += '>' + str + '</' + tag + '>'; }
	else { html += '/>'; }
	return html;
};
var WXICONS = {
	"Mostly Clear-night": "21.svg" ,
	"Mostly Clear-day": "22.svg" ,
	"Mostly Cloudy-night": "27.svg" ,
	"Mostly Cloudy-day": "28.svg" ,
	"Mostly Sunny-day": "30.svg" ,
	"Partly Cloudy-night": "27.svg" ,
	"Partly Cloudy-day": "28.svg" ,
	"Partly Sunny-day": "28.svg" ,
	"Slight Chance Rain Showers-day": "11.svg" ,
	"Slight Chance Rain Showers-night": "11.svg" ,
	"Sunny-day": "36.svg" ,
	"Clear-day": "32.svg" ,
	"Clear-night": "31.svg" ,
	"Chance Rain Showers-night": "45.svg" ,
	"Chance Rain Showers-day": "39.svg" ,
	"Chance Showers And Thunderstorms-night": "47.svg" ,
	"Chance Showers And Thunderstorms-day": "37.svg",
	"Slight Chance Showers And Thunderstorms-night": "47.svg",
	"Slight Chance Showers And Thunderstorms-day": "37.svg",
	"Showers And Thunderstorms Likely-night": "47.svg",
	"Showers And Thunderstorms Likely-day": "37.svg",
};