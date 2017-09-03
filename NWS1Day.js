//Global Variables
var cities = {
	"Arden,DE":"39.809,-75.487",
	"New Castle Airport" : "39.6773,-75.6062",
	"Wildwood,NJ":"39,-74.82",
	"Elmer,NJ" : "39.5951,-75.170",
	"Philadelphia,PA" : "39.9526,-75.1652",
	"Philadelphia International Airport" : "39.8783,-75.2402",
	"Chicago,IL" : "41.85,-87.65",
	"Starved Rock State Park" : "41.3131,-88.9676",
	"Bolingbrook,IL" : "41.6986,-88.0684",
	"Chicago O'Hare International Airport" : "41.9798,-87.882",
	"Seattle,WA" : "47.6062,-122.3321",
	"Houston,TX": "29.7633,-95.3633",
	"New Orleans,LA": "29.9546,-90.0751"
};
var city;
var NWSFORECAST = {
 	metaData: {}, //Metadata for this point goes here
	forecast: {}, //7-day forecast goes here
	hourly: {}, //Hourly Forecast goes here
	grid: {}, //GridForecast goes here
	observationStations: {}, //ObservationStations go here
	currentObs: {}, //current observation data here
	errorResponse: {}, //error objects go here (overloading can occur)
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
			.fail(function(h,s,e){alert('Failed in NWSFORECAST.loadForecast'); NWSFORECAST.errorResponse = h; nwsAPIFail(h,s,e);});
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
			.fail(function(h,s,e){alert('Failed in NWSFORECAST.loadHourly'); NWSFORECAST.errorResponse = h; nwsAPIFail(h,s,e,callback)});
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
			.fail(function(h,s,e){alert('Failed in NWSFORECAST.loadObservationStations'); NWSFORECAST.errorResponse = h; nwsAPIFail(h,s,e);});
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
			.fail(function(h,s,e){alert('Failed in NWSFORECAST.loadGrid'); NWSFORECAST.errorResponse = h; nwsAPIFail(h,s,e)});
		}
	}
};
function nwsAPIFail(header, status, error, callback) {
	console.log(header.responseText);
	var aText = 'API Failed -- ' + header.status + ', ' + header.statusText + '\n' + header.responseJSON.detail;
	alert(aText);
	callback(header, status, error);
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
	var html = '';
	console.log('got to displayCurrObs: ' + data.id);
	html += TAG.p({class: 'currCondIdLine', text: 'Currently at ' + NWSFORECAST.observationStations.features[0].properties.name + ':'});
	html += TAG.div({class: "curCondHeadline", text:
		  TAG.img({src: data.properties.icon})
		+ TAG.p({class: 'condTemp', text:
			  degF(data.properties.temperature.value, data.properties.temperature.unitCode)+'&deg;F'
			+ TAG.span({class: 'currCondDesc', text: data.properties.textDescription})
		})
	});
	html += TAG.div({class: 'currCondSubHead', text: 
		TAG.p({
	  		class: 'currCondElement',
	  		text: TAG.span({class: 'fldLbl', text: 'Winds: '}) + TAG.span({class: 'fldVal', text: formatWinds(data.properties.windDirection, data.properties.windSpeed)})
	  })
	  + TAG.p({
	  		class: 'currCondElement',
	  		text: TAG.span({class: 'fldLbl', text: 'Humidity: '}) + TAG.span({class: 'fldVal', text: Math.round(data.properties.relativeHumidity.value)+'%'})
	  })
	  + TAG.p({
	  		class: 'currCondElement',
	  		text: TAG.span({class: 'fldLbl', text: 'DewPoint: '}) + TAG.span({class: 'fldVal', text: degF(data.properties.dewpoint.value,data.properties.dewpoint.unitCode) + '&deg;F'})
	  })
	  + TAG.p({
			class: 'currCondElement',
			text: (TAG.span({class: 'fldLbl', text: 'Visibility: '}) + m2mi(data.properties.visibility.value).toFixed(0) + ' mi')
		})
	  //Viz, UV
	  + TAG.p({
			class: 'currCondElement',
			text: (TAG.span({class: 'fldLbl', text: 'Barometer: '}) + formatBarometer(data.properties.barometricPressure))
		})
	});
	$('#currentConditions').html(html);
};
function formatWinds(dir, spd) {
	var mph = (m2mi(spd.value)*60*60);
	return TAG.span({class: 'windDir', text: deg2ArrowChar(dir.value) + '' + mph.toFixed(0) + ' mph'});
};
function degF(temp,uom) {
	return (uom.match(/degC/))?Math.round((9.0/5.0)*temp+32.0):temp;
};
function formatBarometer(objBP) {
	var pascalsPerInHg = 3386.3886666667;
	return (objBP.value/pascalsPerInHg).toFixed(2) + 'inHg';
};

function processForecast(data, status, xhdr) {
	var html ='', thisPeriod;
	html += TAG.div({class: 'fcstHeadline', text: 
		  TAG.p({class: 'fcstCity', text: 'Forecast for: ' + city})
		+ TAG.p({class: 'fcstArea', text: processRelativeLocation(NWSFORECAST.metaData.properties.relativeLocation.properties)})
		+ TAG.p({class: 'updTime', text: 'Updated: ' + new Date(data.properties.updated).toLocaleString()})
	});
	html += '<table><tr>';
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
	if (status == 'error') {
		$('#hourly').html('API Failed -- ' + data.status + ', ' + data.statusText + '\n' + data.responseJSON.detail);
	}
	else {
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
	}
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
	var dist = m2mi(locprops.distance.value);
	if (dist > 1) rzlt += dist.toFixed(1) + ' mi ' + deg2compass(locprops.bearing.value)
	+ ' of ' + locprops.city + ', ' + locprops.state;
	return rzlt;
};
function m2mi(dist) {
	return dist * 100 / 2.54 / 12 / 5280;
};
function deg2compass(brng) {
	var crose = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'], ndx;
	// (deprecated) var ndx = Math.floor(((11.25+brng) % 360) / 22.5);
	var ndx = Math.round(brng / 22.5) % 16;
	return crose[ndx];
};
function deg2ArrowChar(deg) {
	//              N         NE        E         SE        S         SW        W         NW
	var dirChar = ['&#8593;','&#8599;','&#8594;','&#8600;','&#8595;','&#8601;','&#8592;','&#8598;'];
	var ndx = Math.round(deg / 45) % 8;
	return dirChar[ndx];
};
var TAG = {
	p: function (options) {
		var rzlt = '';
		rzlt += '<p';
		for (var attr in options) {
			if (attr != 'text') rzlt += ' ' + attr + '="' + options[attr] + '"';
		}
		rzlt += '>' + options.text + '</p>';
		return rzlt;
	},
	div: function (options) {
		var rzlt = '';
		rzlt += '<div';
		for (var attr in options) {
			if (attr != 'text') rzlt += ' ' + attr + '="' + options[attr] + '"';
		}
		rzlt += '>' + options.text + '</div>';
		return rzlt;
	},
	span: function (options) {
		var rzlt = '';
		rzlt += '<span';
		for (var attr in options) {
			if (attr != 'text') rzlt += ' ' + attr + '="' + options[attr] + '"';
		}
		rzlt += '>' + options.text + '</span>';
		return rzlt;
	},
	img: function (options) {
		var rzlt = '';
		rzlt += '<img';
		for (var attr in options) {
			if (attr != 'text') rzlt += ' ' + attr + '="' + options[attr] + '"';
		}
		rzlt += '>'  + '</img>';
		return rzlt;
	}
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