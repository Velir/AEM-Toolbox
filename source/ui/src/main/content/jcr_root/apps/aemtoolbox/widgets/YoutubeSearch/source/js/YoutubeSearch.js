//create widget namespace
CQ.Ext.ns('AEM.Toolbox.Widgets');

AEM.Toolbox.Widgets.YoutubeSearch = CQ.Ext.extend(CQ.Ext.form.TriggerField, {
    /**
     * @cfg {String} youtubeUser
     * Youtube User to search for videos from.
     */
    youtubeUser: '',

	/**
	 * @cfg {String} apiKey
	 * API Key to retrieve video information
	 */
    apiKey: '',

	/**
	 * @cfg {String} playlistId
	 * API Key to retrieve video information
	 */
	playlistId: '',

	/**
	 * @cfg {String} fieldDescription
	 * Default description for YouTube Search
	 */
	fieldDescription:"The video code is the ID for the youtube video. You can use the full url like http://www.youtube.com/watch?v=Pqs08TS4l0U, the id Pqs08TS4l0U, or type a keyword and press enter to search Youtube.",
    /**
     * @cfg {Boolean} allowBlank Specify false to validate that the value's length is > 0 (defaults to true)
     */
    allowBlank : true,

    /**
     * The panel holding the youtube video results
     * @type AEM.Toolbox.Widgets.YoutubeDialog
     * @private
     */
    dialog: null,

    onTriggerClick: function(){
        if (this.disabled) {
            return;
        }
        this.doSearch();
    },

    /**
     * Executed on key up in the control.
     * @private
     */
    keyup: function(comp, evt) {
        var key = evt.getKey();
        if (key == 13) {
            // [enter] hit
            this.doSearch();
        }
    },

    /**
     * Performs our search.
     * @private
     */
    doSearch: function() {
        // lazy creation of browse dialog
        if (this.dialog == null) {
            //create dialog
            function okHandler() {
                var videoId = this.getSelectedVideo();
                var videoTitle = this.getSelectedVideoTitle();
                if(videoId){
                    this.videoSearchField.setValue(videoId);
                }
                this.hide();
            }

			var channelList = null;
			if(this.playlistId){
				channelList = this.playlistId;
			} else{
				var channelUrl = "https://www.googleapis.com/youtube/v3/channels?key=" + this.apiKey + "&part=contentDetails&forUsername=" + this.youtubeUser;
				var channelInfo = CQ.HTTP.eval(channelUrl);

				channelList = channelInfo.items[0].contentDetails.relatedPlaylists.uploads;
			}


			var videoUrl = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=" + channelList + "&key=" + this.apiKey;
            var dialogConfig = CQ.Util.applyDefaults(this.dialogCfg, {
                ok: okHandler,
                videoSearchField: this,
                url: videoUrl,
                "buttons": CQ.Dialog.OKCANCEL
            });

            this.dialog = new AEM.Toolbox.Widgets.YoutubeDialog( dialogConfig );

        }
        this.dialog.loadAndShowVideos( this.getValue() );
        this.dialog.show();
        this.fireEvent("dialogopen");
    },

    /**
     * Override getValue to strip out video id's
     */
    getValue: function(){
        var val = AEM.Toolbox.Widgets.YoutubeSearch.superclass.getValue.call(this);
        //TODO Allow 'www.youtube.com/watch?v=n1dKVVosqJk' structure
        var youRegEx = /(http|https):\/\/(?:youtu\.be\/|(?:[a-z]{2,3}\.)?youtube\.com\/watch(?:\?|#\!)v=)([\w-]{11}).*/;

        if(youRegEx.test(val)) {
            var match = youRegEx.exec(val);
            return match[2];
        }

        return val;
    },

    validate: function(){
        try{
            var val = this.getValue();
        }catch(er){
            //multifield hack because it doesn't destroy items when removed
            return true;
        }

        var isValidId = (val.length == 11) || (this.allowBlank && !val);
        if(!isValidId){
            this.markInvalid('Can not recognize video from youtube URL. Please copy/paste a full URL from a Youtube video page, or copy the ID directly.');
            return false;
        } else{
            return AEM.Toolbox.Widgets.YoutubeSearch.superclass.validate.call(this);
        }

        //return isValidId;
    },

    /**
     * Override CQ.Ext.form.TriggerField onBeforeSubmit method.
     * Will handle some extra processing before submitting the dialog.
     * Checks to see if the value is a valid youtube id
     */
    onBeforeSubmit: function() {
        try{
            var val = this.getValue();
            var isValid = this.validate();
            if(isValid){
                this.setValue(val);
            }

            return isValid;
        }catch(er){
            //multifield hack because it doesn't destroy items when removed
            return true;
        }
    },

    // overriding CQ.Ext.Panel#onRender
    onRender: function(ct, pos) {
        // todo hack to be removed; Dialog should dispatch this event to all subcomponents
		AEM.Toolbox.Widgets.YoutubeSearch.superclass.onRender.call(this, ct, pos);
        var dialog = this.findParentByType("dialog");
        if (dialog) {
            dialog.addListener("beforesubmit", this.onBeforeSubmit, this);
        } else {
            var form = this.findParentByType(CQ.Ext.form.FormPanel);
            if (form) {
                var frm = form.getForm();
                frm.on("beforeaction", function() {
                    return this.onBeforeSubmit();
                }, this);
            }
        }
    },

    constructor : function(config) {
        CQ.Util.applyDefaults(config, {
            // show a search icon
            triggerClass: "x-form-search-trigger",
            enableKeyEvents: true
        });

		AEM.Toolbox.Widgets.YoutubeSearch.superclass.constructor.call(this, config);
    },

    initComponent : function() {
		AEM.Toolbox.Widgets.YoutubeSearch.superclass.initComponent.call(this);

        this.addListener("keyup", this.keyup, this);
        this.addEvents(
            /**
             * @event dialogopen
             * Fires when the youtube video dialog is opened.
             * @param {AEM.Toolbox.Widgets.YoutubeSearch} this
             */
            "dialogopen"
        );
    }
});

CQ.Ext.reg("youtubesearch", AEM.Toolbox.Widgets.YoutubeSearch);