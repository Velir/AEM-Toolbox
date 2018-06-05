//create widget namespace
// CQ.Ext.ns('AEM.Toolbox.Widgets.rte.plugins');
var AEM = AEM || {};
AEM.Toolbox = AEM.Toolbox || {};
AEM.Toolbox.Widgets = {};
AEM.Toolbox.Widgets.rte = {};
AEM.Toolbox.Widgets.rte.plugins = {};

AEM.Toolbox.Widgets.rte.plugins.RTEBlockquotePlugin = new Class({

    extend: CUI.rte.plugins.Plugin,

	/**
	 * @private
	 */
	blockquoteUI:null,

	/**
	 * @private
	 */
	linedBlockquoteUI:null,

	/**
	 * @private
	 */
	unlinedBlockquoteUI:null,

	constructor:function (editorKernel) {
		AEM.Toolbox.Widgets.rte.plugins.RTEBlockquotePlugin.superclass.constructor.call(this, editorKernel);
	},

	//returns all features this plugin supports.
	getFeatures:function () {
		return [ "blockquote", "linedblockquote", "ulinedblockquote" ];
	},

	//called by rte kernel when rte is first generated.
	initializeUI:function (tbGenerator) {
		var ui = CUI.rte.ui;
		if (this.isFeatureEnabled("blockquote")) {
			this.blockquoteUI = tbGenerator.createElement("blockquote", this, true, this.getTooltip("blockquote"));
			//toolbar builder addElement method takes (groupId, groupSort, uiElement, uiElementSort)
			tbGenerator.addElement("blockquote", 1100, this.blockquoteUI, 110);
		}
		if (this.isFeatureEnabled("linedblockquote")) {
			this.linedBlockquoteUI = tbGenerator.createElement("linedblockquote", this, true, this.getTooltip("linedblockquote"));
			//toolbar builder addElement method takes (groupId, groupSort, uiElement, uiElementSort)
			tbGenerator.addElement("blockquote", 1200, this.linedBlockquoteUI, 110);
		}

		if (this.isFeatureEnabled("ulinedblockquote")) {
			this.unlinedBlockquoteUI = tbGenerator.createElement("ulinedblockquote", this, true, this.getTooltip("ulinedblockquote"));
			//toolbar builder addElement method takes (groupId, groupSort, uiElement, uiElementSort)
			tbGenerator.addElement("blockquote", 1200, this.unlinedBlockquoteUI, 110);
		}
	},

	//this is where we can add some hard defaults for our plugin config.
	notifyPluginConfig:function (pluginConfig) {
		// configuring "blockquote" dialog
		pluginConfig = pluginConfig || { };
		var defaults = {
			"tooltips":{
				"blockquote":{
					"title":CQ.I18n.getMessage("Blockquote"),
					"text":CQ.I18n.getMessage("Wrap selection as a blockquote.")
				},
				"linedblockquote":{
					"title":CQ.I18n.getMessage("Pull Quote"),
					"text":CQ.I18n.getMessage("Wrap selection as a pull quote.")
				},
				"ulinedblockquote":{
					"title":CQ.I18n.getMessage("Introduction"),
					"text":CQ.I18n.getMessage("Wrap selection as an introduction quote.")
				}
			}
		};
        CUI.rte.Utils.applyDefaults(pluginConfig, defaults);
		this.config = pluginConfig;
	},

	//called when a command is pressed for this plugin.
	execute:function (cmd, value, options) {
		if (cmd == "blockquote" && this.blockquoteUI) {
			this.editorKernel.relayCmd("rteblockquotecommand", this.blockquoteUI.getExtUI().pressed);
		}
		if (cmd == "linedblockquote" && this.linedBlockquoteUI) {
			this.editorKernel.relayCmd("rtelinedblockquotecommand", this.linedBlockquoteUI.getExtUI().pressed);
		}
		if (cmd == "ulinedblockquote" && this.unlinedBlockquoteUI) {
			this.editorKernel.relayCmd("rteunlinedblockquotecommand", this.unlinedBlockquoteUI.getExtUI().pressed);
		}
	},

	//called when some action is performed in the rte.
	updateState:function (selDef) {
		if (this.blockquoteUI && this.blockquoteUI.getExtUI()) {
			//set button state.
			this.blockquoteUI.getExtUI().toggle(this.editorKernel.queryState("rteblockquotecommand", selDef));
		}
		if (this.linedBlockquoteUI && this.linedBlockquoteUI.getExtUI()) {
			//set button state.
			this.linedBlockquoteUI.getExtUI().toggle(this.editorKernel.queryState("rtelinedblockquotecommand", selDef));
		}
		if (this.unlinedBlockquoteUI && this.unlinedBlockquoteUI.getExtUI()) {
			//set button state.
			this.unlinedBlockquoteUI.getExtUI().toggle(this.editorKernel.queryState("rteunlinedblockquotecommand", selDef));
		}
	}
});

//register plugin
CUI.rte.plugins.PluginRegistry.register("blockquote", AEM.Toolbox.Widgets.rte.plugins.RTEBlockquotePlugin);