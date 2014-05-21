//create widget namespace
CQ.Ext.ns('AEM.Toolbox.Widgets.rte.commands');

AEM.Toolbox.Widgets.rte.commands.RTEBlockquoteCommand = CQ.Ext.extend(CQ.form.rte.commands.Command, {
	//Class to apply to inner paragraph
	paragraphClassStyle:function(){
		return "";
	},

	//determines if the command provided is a match for this command object.
	isCommand:function (cmdStr) {
		return (cmdStr.toLowerCase() == "rteblockquotecommand");
	},

	getProcessingOptions:function () {
		var cmd = CQ.form.rte.commands.Command;
		return cmd.PO_BOOKMARK | cmd.PO_SELECTION;
	},

	//called by plugin to execute this command.
	execute:function (execDef) {
		//get our dom processor.
		var dpr = CQ.form.rte.DomProcessor;

		//get objects necessary for determining if we should add or remove blockquote tags.
		var selection = execDef.selection;
		var context = execDef.editContext;

		//get our node list
		var nodeList = execDef.nodeList;
		if (!nodeList) {
			nodeList = dpr.createNodeList(context, selection);
		}

		//determine if we are active
		var active = this.isActive(nodeList);

		//if we are active then remove our blockquote
		if (active) {
			this.removeBlockquote(nodeList);
		} else {
			this.addBlockquote(context, selection, nodeList);
		}
	},

	removeBlockquote:function (nodeList) {
		//get our dom processor.
		var dpr = CQ.form.rte.DomProcessor;

		//get our blockquote
		var blockquote = this.getClosestBlockquote(nodeList);

		//remove node
		if (blockquote != null) {
			//remove any additional structure
			this.removeBlockquoteStructure(blockquote);

			//remove blockquote
			dpr.removeWithoutChildren(blockquote);
		}
	},

	removeBlockquoteStructure:function (blockquote) {
		//override to add any additional processing
	},

	addBlockquote:function (context, selection, nodeList) {
		//see if a blockquote exists
		var blockquote = this.getClosestBlockquote(nodeList);

		//if we already have a blockquote then process it
		if (blockquote) {
			this.addBlockquoteStructure(blockquote);
			return;
		}

		//get our common library and dom processor.
		var com = CQ.form.rte.Common;
		var dpr = CQ.form.rte.DomProcessor;

		//get our container list.  this is what we want to wrap.
		var containerList = dpr.createContainerList(context, selection);

		//if we don't have a container list then we need to create the blockquote tag ourself.
		if (containerList.length == 0) {
			//get our aux root.  this will be something like a table td, etc.
			var auxRoot = com.getTagInPath(context, nodeList.commonAncestor, dpr.AUXILIARY_ROOT_TAGS);

			//if we have an aux root, we need to create our blockquote tag inside it.
			if (auxRoot) {
				blockquote = dpr.createNode(context, "blockquote");

				//move the children of our aux root into our blockquote.
				com.moveChildren(auxRoot, blockquote);

				//move the blockquote to the aux root.
				auxRoot.appendChild(blockquote);

				//process blockquote
				this.addBlockquoteStructure(blockquote);
			}
		} else {
			blockquote = dpr.restructureAsChild(context, containerList[0].parentNode, containerList, "blockquote", null);

			//process blockquote
			this.addBlockquoteStructure(blockquote);
		}
	},

	addBlockquoteStructure:function (blockquote) {
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
			firstChild.className = this.paragraphClassStyle();
		}
	},

	//called by the plugin to determine the state of this command.
	//information returned to the plugin can allow the plugin to manipulate the UI.
	queryState:function (selectionDef, cmd) {
		//only execute if we are the correct command.
		if (!this.isCommand(cmd)) {
			return false;
		}

		//return if we are active
		return this.isActive(selectionDef.nodeList);
	},

	isActive:function (nodeList) {
		//if we don't have a node list, return false
		if (nodeList == null) {
			return false;
		}

		//get our closes blockquote
		var blockquote = this.getClosestBlockquote(nodeList);

		//return if our blockquote structure is the correct structure
		return this.isCorrectBlockquoteStructure(blockquote);
	},

	getClosestBlockquote:function (nodeList) {
		//if we don't have a node list, return null
		if (nodeList == null) {
			return null;
		}

		//get our common ancester in our node list.
		var nodeToCheck = nodeList.commonAncestor;

		//initialize variable to hold our blockquote to return.
		var blockquote = null;

		//start by checking common ancestors to see if they are wrapped in a blockquote.
		while (nodeToCheck) {
			if (nodeToCheck.nodeType == 1) {
				//if our node is a blockquote then set it and break.
				if (nodeToCheck.tagName.toLowerCase() == "blockquote") {
					blockquote = nodeToCheck;
					break;
				}
			}

			//check out parent for the blockquote tag.
			nodeToCheck = nodeToCheck.parentNode;
		}

		//check first level nodes also, if no parent blockquote has been detected
		//we don't want to allow embeded blockquote tags.
		if (blockquote == null) {
			var nodeCnt = nodeList.nodes.length;
			for (var nodeIndex = 0; nodeIndex < nodeCnt; nodeIndex++) {
				nodeToCheck = nodeList.nodes[nodeIndex];
				if (nodeToCheck.dom.nodeType == 1) {
					if (nodeToCheck.tagName.toLowerCase() == "blockquote") {
						blockquote = nodeToCheck;
						break;
					}
				}
			}
		}

		//return our blockquote.
		return blockquote;
	},

	isCorrectBlockquoteStructure:function (blockquote) {
		//if we don't have a node list, return false
		if (blockquote == null) {
			return false;
		}

		//check first child and make sure it is a <p/> tag with no class
		if (!blockquote.childNodes || !blockquote.childNodes[0]) {
			return false;
		}

		//get first child and check
		var firstChild = blockquote.childNodes[0];
		return firstChild.nodeType == 1 && firstChild.tagName.toLowerCase() == "p" && firstChild.className == this.paragraphClassStyle();
	}
});

// register command
CQ.form.rte.commands.CommandRegistry.register("rteblockquotecommand", AEM.Toolbox.Widgets.rte.commands.RTEBlockquoteCommand);