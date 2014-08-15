/**
 * Visual Timeline JavaScript Library v0.1
 *
 * Usage:

 *		
 *	AUTHOR: Zeek Wang
 *  Date: 2014/08/15
 */

(function(){

	var VTL = function(config){
		init(config);
	};

	var config = {};

	function init(userConfig){

	}

	VTL.xxx = function() {

	}

	function map(value, min, max, toMin, toMax){
		var v = (value - min) / (max - min) * (toMax - toMin) + toMin;
		return v;
	}

	function simpleMap(value, max, toMax){
		if (max < 0.00001)
			return 0;
		
		if (value < 0)
			value = 0;
		if (value > max)
			value = max;

		return v = value / max * toMax;
	}
	
	function sqrt(value){
		return Math.sqrt(value);
	}

	window['VTL'] = VTL;
})();