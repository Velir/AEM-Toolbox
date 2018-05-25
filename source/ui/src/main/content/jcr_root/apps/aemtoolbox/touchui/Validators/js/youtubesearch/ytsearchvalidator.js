(function(ns, $, Granite){
	'use strict';

	ns.validators = {
		ytsearchvalidate: function ($el) {
			try{
				var val = ns.utils.getYoutubeVideoId($el)
			}catch(er){
				//multifield hack because it doesn't destroy items when removed
				return true;
			}

			var isValidId = (val.length === 11);

			if(!isValidId){
				return 'Can not recognize video from youtube URL. Please copy/paste a full URL from a Youtube video page, or copy the ID directly.';
			}else {
				$el.value = val;
			}
		}
	};

    ns.utils = {
		getYoutubeVideoId: function($el){
			var val = $el.value;
			//TODO Allow 'www.youtube.com/watch?v=n1dKVVosqJk' structure
			var youRegEx = /(http|https):\/\/(?:youtu\.be\/|(?:[a-z]{2,3}\.)?youtube\.com\/watch(?:\?|#\!)v=)([\w-]{11}).*/;

			if(youRegEx.test(val)) {
				var match = youRegEx.exec(val);
				return match[2];
			}
			return val;
		}
    }

})(window.VelirValidators = window.VelirValidators || {}, jQuery, Granite);

