//create widget namespace
CQ.Ext.ns('AEM.Toolbox.Widgets.rte.commands');

AEM.Toolbox.Widgets.rte.commands.RTELinedBlockquoteCommand = CQ.Ext.extend(AEM.Toolbox.Widgets.rte.commands.RTEBlockquoteCommand, {

	paragraphClassStyle:function(){
		return "lined"
	},

	//determines if the command provided is a match for this command object.
	isCommand:function (cmdStr) {
		return (cmdStr.toLowerCase() == "rtelinedblockquotecommand");
	},

	removeBlockquoteStructure:function (blockquote) {
		//if we don't have a node list, return
		if (blockquote == null) {
			return;
		}

		//check first child and make sure it is a <p/> tag
		if (!blockquote.childNodes || !blockquote.childNodes[0]) {
			return;
		}

		//get first child and process
		var firstChild = blockquote.childNodes[0];
		if (firstChild.tagName.toLowerCase() == "p") {
			firstChild.className = "";
		}
	}
});

// register command
CQ.form.rte.commands.CommandRegistry.register("rtelinedblockquotecommand", AEM.Toolbox.Widgets.rte.commands.RTELinedBlockquoteCommand);