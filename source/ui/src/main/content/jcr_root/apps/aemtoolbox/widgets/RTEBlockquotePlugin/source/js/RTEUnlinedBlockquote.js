//create widget namespace
var AEM = AEM || {};
AEM.Toolbox = AEM.Toolbox || {};
AEM.Toolbox.Widgets = AEM.Toolbox.Widgets || {};
AEM.Toolbox.Widgets.rte = AEM.Toolbox.Widgets.rte || {};
AEM.Toolbox.Widgets.rte.commands = AEM.Toolbox.Widgets.rte.commands || {};

AEM.Toolbox.Widgets.rte.commands.RTEUnlinedBlockquoteCommand = new Class({

    extend: AEM.Toolbox.Widgets.rte.commands.RTELinedBlockquoteCommand,

	//determines if the command provided is a match for this command object.
	isCommand:function (cmdStr) {
		return (cmdStr.toLowerCase() == "rteunlinedblockquotecommand");
	},

	paragraphClassStyle:function(){
		return "unlined";
	}
});

// register command
CUI.rte.commands.CommandRegistry.register("rteunlinedblockquotecommand", AEM.Toolbox.Widgets.rte.commands.RTEUnlinedBlockquoteCommand);