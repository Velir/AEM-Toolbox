//create widget namespace
CQ.Ext.ns('AEM.Toolbox.Widgets.StructuredMultiList');

AEM.Toolbox.Widgets.StructuredMultiList.Slide = CQ.Ext.extend(CQ.Ext.emptyFn, {

	/**
	 * @cfg {Object} referencedFileInfo
	 * The current info of the referenced file that defines the slide. This has the
	 * same format as {@link CQ.form.SmartFile#referencedFileInfo}. Defaults to null.
	 */
	referencedFileInfo: null,

	/**
	 * @cfg {Number} slideIndex
	 * "Index" of the slide; is used to create unique slide names. Newly created slides
	 * will have -1, which will be resolved to a correct value before submitting the
	 * form. Defaults to -1.
	 */
	slideIndex: 0,

	/**
	 * @cfg {Number} sortOrder
	 * The sort order to display our slides in on the front end.
	 */
	sortOrder: 0,

	/**
	 * @cfg {Boolean} isPersistent
	 * True if the slide is already persisted, false if it has been added in the current
	 * user transaction (defaults to false)
	 */
	isPersistent: false,

	/**
	 * @cfg {Boolean} isDeleted
	 * True if the slide has been deleted by the user (defaults to false)
	 */
	isDeleted: false,

	/**
	 * @cfg {Boolean} isInvalid
	 * True if the slide is valid.
	 */
	isValid: false,

	/**
	 * @cfg {Boolean} isModified
	 * True if the slide has been modified with tools.
	 */
	isModified: false,

	/**
	 * @cfg {String} defaultSlideName
	 * Name of new Slide display
	 */
	defaultSlideName: null,

	/**
	 * @cfg {String} hideImage
	 * If this slide has an image or not
	 */
	hideImage: false,

	/**
	 * @cfg {String} itemResourceType
	 * The sling:resourceType to assign to this slide when it is stored to the jcr.
	 */
	itemResourceType: '',


	/**
	 * Constructor for creating a new slide.
	 */
	constructor: function (config) {
		//create default configuration
		var defaults = {
			"referencedFileInfo": null,
			"isPersistent": false,
			"isDeleted": false,
			"slideIndex": -1,
			"sortOrder": -1,
			hideImage: false,
			"defaultSlideName": "New slide"
		};

		//apply our configuration.
		CQ.Ext.apply(this, config, defaults);
	},

	/**
	 * Will create the text to be displayed in the combobox.
	 */
	createDisplayText: function () {
		//try to find value specified in configuration
		var displayField;
		for (var i = 0; i < this.items.length; i++) {
			if (this.items[i].useForDisplay) {
				displayField = this[this.items[i].itemId];
			}
		}

		//if the user provided a display value then return that
		if (displayField) {
			return displayField;
		} else {
			//if we have a referenced file then use its path.
			if (this.referencedFileInfo) {
				return this.referencedFileInfo.dataPath;
			} else {
				//default to new slide text.
				return this.defaultSlideName ? this.defaultSlideName : "New Slide";
			}
		}
	},

	isEmptySlide: function () {
		var isEmpty = true;

		if (this.referencedFileInfo) {
			return false;
		}

		//go through each item and get push our values
		for (var i = 0; i < this.items.length; i++) {
			var itemValue = this[this.items[i].itemId];
			var itemName = this.items[i].name;
			if (itemValue) {
				isEmpty = false;
				break;
			}
		}
		return isEmpty;
	},

	/**
	 * Create and return the fields used to save our slide to the jcr.
	 */
	createTransferFields: function (prefix) {
		//initialize our fields array
		var fields = [ ];

		//create the path our slide will be saved to.
		var basicName = prefix.replace("$", this.slideIndex);

		//Common function to add hidden fields
		var addHidden = function (hiddenName, hiddenValue) {
			var hiddenInput = new CQ.Ext.form.Hidden({
				"ignoreData": true,
				"name": basicName + "/" + hiddenName,
				"value": hiddenValue
			});
			fields.push(hiddenInput);
		};

		//if our slide isn't being deleted then create hidden fields
		//for its values and add then to our array.
		if (!this.isDeleted && !this.isEmptySlide()) {
			addHidden("fileReference", this.referencedFileInfo ? this.referencedFileInfo.dataPath : "");

			//go through each item and get push our values
			for (var i = 0; i < this.items.length; i++) {
				var item = this.items[i];
				var itemValue = this[item.itemId];
				var itemName = item.name;

				//if multi push each field separately
				if (!(itemValue instanceof Array)) {
					itemValue = [ itemValue ];
				}

				//if checkbox and has checkboxTypeHint, send 'false' when unclicked
				var hasNoValue = !itemValue || itemValue.length == 0;
				var isCheckbox = item.xtype == "selection" && item.type == "checkbox";
				if (isCheckbox && item.checkboxBoolTypeHint && hasNoValue) {
					itemValue = ["false"];
				}

				//if datetime and requires typehint, be sure to include it
				if (item.xtype == "datetime" && !item.disableTypeHint) {
					addHidden(itemName + "@TypeHint", item.typeHint ? item.typeHint : "Date");
				}

				for (var j = 0; j < itemValue.length; j++) {
					var value = itemValue[j];
					addHidden(itemName, value ? value : "");
				}
			}

			addHidden("imageCrop", this.imageCrop ? this.imageCrop : "");
			addHidden("imageRotate", this.imageRotate ? this.imageRotate : "");

			addHidden("SortOrder", this.sortOrder);

			if (!this.hideImage) {
				addHidden("sling:resourceType", this.itemResourceType);
			}

			//Set image sizing properties
			if (this.maxwidth) {
				addHidden("maxwidth", this.maxwidth);
			}

			if (this.maxheight) {
				addHidden("maxheight", this.maxheight);
			}

			if (this.hardheight) {
				addHidden("hardheight", this.hardheight);
			}

			if (this.hardwidth) {
				addHidden("hardwidth", this.hardwidth);
			}

			//allow lastModified stamping
			addHidden("jcr:lastModified", "");
			addHidden("jcr:lastModifiedBy", "");
		} else if (this.isPersistent) {
			//our slide is being deleted and has already been persisted to the jcr.
			//create a hidden form field to tell sling to delete this slide.
			var deletePrm = basicName + CQ.Sling.DELETE_SUFFIX;
			fields.push(new CQ.Ext.form.Hidden({
				"name": deletePrm,
				"value": "true"
			}));
		}

		//return our fields for processing.
		return fields;
	}

});