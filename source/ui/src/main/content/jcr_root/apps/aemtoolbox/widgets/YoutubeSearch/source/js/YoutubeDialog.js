//create widget namespace
CQ.Ext.ns('AEM.Toolbox.Widgets');

/**
 * @class AEM.Toolbox.Widgets.YoutubeDialog
 * @extends CQ.Dialog
 * @author krasmussen
 * A Dialog for viewing youtube videos and selecting one
 * @constructor
 * Creates a new YoutubeDialog.
 * @param {Object} config The config object
 */
AEM.Toolbox.Widgets.YoutubeDialog = CQ.Ext.extend(CQ.Dialog, {

    /**
     * The browse dialog's tree panel.
     * @private
     * @type CQ.Ext.Panel
     */
    panel: null,

    /**
     * The dialog's video search field.
     * @private
     * @type AEM.Toolbox.Widgets.YoutubeSearch
     */
    videoSearchField : null,

    /**
	 * @cfg {String} url
	 * URL to load youtube videos from
	 */
    url : '',

    loadAndShowVideos: function( search ) {
        this.updateUrl(search);
        this.jsonStore.load();
    },

    updateUrl: function(search) {
        var paramString = search? 'q=' + search : "";
        var newUrl = CQ.Ext.urlAppend(this.url, paramString);
        this.jsonStore.proxy.setApi(CQ.Ext.data.Api.actions.read, newUrl);
    },

    /**
     * Returns the youtube video id
     * tree node has been selected yet).
     * @return {String} The video id
     */
    getSelectedVideo: function() {
        var retId = null;
        if(this.dataview.getSelectionCount() == 1){
            var selections = this.dataview.getSelectedRecords();
            var selected = selections[0];
            retId = selected.json.contentDetails.videoId;
        }
        return retId;
    },

    getSelectedVideoTitle: function(){
        var retTitle = null;
        if(this.dataview.getSelectionCount() == 1){
            var selections = this.dataview.getSelectedRecords();
            var selected = selections[0];
            retTitle = selected.json.snippet.title;
        }
        return retTitle;
    },

    onException: function(proxy, type, action, options, response, arg) {
        //Happens due to a bug in youtube's API when retrieving an empty list
        //Remove all records in the store and reload it
        this.removeAll(false);
        if (arg) {
            //console.log(arg.message);
        }
    },

    initComponent: function(){
		AEM.Toolbox.Widgets.YoutubeDialog.superclass.initComponent.call(this);
    },

    constructor: function(config){
        //Create Dataview and its container Panel for this dialog
        var proxy = new CQ.Ext.data.ScriptTagProxy({
            url: this.url,
            callback: 'proxyCallback',
            scope: this
        });

        this.jsonStore = new CQ.Ext.data.JsonStore({
            id: 'jsonStore',
            idProperty: 'contentDetails.videoId',
            totalProperty: 'pageInfo.totalResults',
            root: 'items',
            fields: [
                {name: 'contentDetails'},
                {name: 'snippet'}
            ],
            autoLoad: false,
            proxy: proxy,
            listeners: {
                exception: this.onException
            }
        });

        this.dataview = new CQ.Ext.DataView({
                store: this.jsonStore,
                tpl: new CQ.Ext.XTemplate(
                    '<div id="vidResults">',
                    '<tpl for=".">',
                    '   <div class="vid-wrapper" id="{[values.contentDetails.videoId]}">',
                    '       <div class="vid-title">{[values.snippet.title]}</div>',
                    '       <table border="0" class="vid-thumb-text-wrapper"><tbody>',
                    '       <tr>',
                    '          <td class="vid-thumb">',
                    '              <img src="{[values.snippet.thumbnails.default.url]}">',
                    '          </td>',
                    '          <td class="vid-cat-desc-wrapper">',
                    '             <div class="vid-desc">{[(values.snippet.description.length > 300)? values.snippet.description.substring(0, 300) + "..." : values.snippet.description]}</div>',
                    '          </td>',
                    '       </tr>',
                    '       </tbody></table>',
                    '   </div>',
                    '</tpl>',
                    '</div>'
                ),
                ref: '../../dataview',
                autoHeight: false,
                autoWidth: false,
                singleSelect : true,
                //width: 450,
                autoScroll: true,
                //multiSelect: false,
                //overClass:'x-view-over',
                itemSelector:'div.vid-wrapper',
                emptyText: 'No videos to display'
        });

        this.panel = new CQ.Ext.Panel({
            id:'youtube-results',
            autoScroll: true,
            width:525,
            autoHeight: false,
            autoWidth: false,
            layout: "absolute",
            title:'Videos',
            ref:'../panel',
            items: this.dataview
        });

        this.items = this.panel;

        CQ.Util.applyDefaults(config, {
            "title": "Select Video",
            autoScroll: true,
            "closable": true,
            "height": CQ.themes.BrowseDialog.HEIGHT,
            "minWidth": CQ.themes.BrowseDialog.MIN_WIDTH,
            "minHeight": CQ.themes.BrowseDialog.MIN_HEIGHT,
            "resizable": CQ.themes.BrowseDialog.RESIZABLE,
            "resizeHandles": CQ.themes.BrowseDialog.RESIZE_HANDLES,
            "autoHeight": false,
            "autoWidth": false,
            buttonAlign : "right",
            "buttons": CQ.Dialog.OKCANCEL ,
            "items" : this.items
        });

		AEM.Toolbox.Widgets.YoutubeDialog.superclass.constructor.call(this, config);
    }
});
