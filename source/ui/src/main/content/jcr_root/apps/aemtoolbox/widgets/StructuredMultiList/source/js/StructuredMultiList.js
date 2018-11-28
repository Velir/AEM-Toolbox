//create widget namespace
CQ.Ext.ns('AEM.Toolbox.Widgets');

AEM.Toolbox.Widgets.StructuredMultiList = CQ.Ext.extend(CQ.form.Slideshow, {
	/**
	 * Will track if the user changed any crop settings.
	 * This is required so we know if our crop tool was initialized with proper
	 * values before saving them back to the jcr.
	 */
	cropActionPerformed: false,

	/**
	 * Will track if the user changed the rotation of the image.
	 * This is required so we know if our rotate tool was initialized with proper
	 * values before saving them back to the jcr.
	 */
	rotateActionPerformed: false,

	hideImage: false,

	itemResourceType: '',

	/**
	 * Constructor for this carousel builder.
	 */
	constructor: function (config) {
		//be sure our config is at least an object
		config = config || { };

		var settings = config.settings || [];

		var maxSlides = config.maxSlides || 8;
		//define our default configuration.
		var defaults = {
			"headPanel": new AEM.Toolbox.Widgets.StructuredMultiList.SlidesPanel({
				"onSlideChanged": this.onSlideChanged.createDelegate(this),
				"onAddButton": this.onAddButton.createDelegate(this),
				"onRemoveButton": this.onRemoveButton.createDelegate(this),
				"onUpButton": this.onUpButton.createDelegate(this),
				"onDownButton": this.onDownButton.createDelegate(this),
				maxSlides: maxSlides
			}),
			"footPanel": new AEM.Toolbox.Widgets.StructuredMultiList.SlideSettingsPanel({"items": settings}),
			"fileReferencePrefix": "./slide$",
			"cropParameter": ":fakeImageCrop",//start this property with : so it will not be stored.
			"rotateParameter": ":fakeImageRotate",//start this property with : so it will not be stored.
			"hideMainToolbar": false,
			"allowReference": true,
			"bodyCssClass": config.hideImage ? "hide-carousel-image" : config.bodyCssClass,
			"allowUpload": false,
			"useFlash": true,
			"maxSlides": maxSlides,
			"itemResourceType": "foundation/components/image"
		};

		//apply our defaults.
		CQ.Util.applyDefaults(config, defaults);

		//call our superclass constructor
		AEM.Toolbox.Widgets.StructuredMultiList.superclass.constructor.call(this, config);

		//be sure our slides represent an empty array.
		this.slides = [ ];
	},

	/**
	 * Init function for this carousel builder
	 */
	initComponent: function () {
		//call our superclass initComponent method.
		AEM.Toolbox.Widgets.StructuredMultiList.superclass.initComponent.call(this);
	},

	/**
	 * Override CQ.form.Slideshow createHiddenInterfaceFields
	 */
	createHiddenInterfaceFields: function () {
		//call slideshow superclass method.
		CQ.form.Slideshow.superclass.createHiddenInterfaceFields.call(this);
	},

	/**
	 * Override CQ.form.SmartImage toolClicked
	 * Will add some tracking code when the user clicks a tool.
	 */
	toolClicked: function (tool) {
		//if our tool is our crop tool then track the click
		if (tool instanceof CQ.form.ImageCrop) {
			this.cropActionPerformed = true;

			//if our crop tool was deselected and our crop values changed, then
			//make sure to keep the new selection.
			if (!tool.buttonComponent.pressed && tool.serialize() != this.editedSlide.imageCrop) {
				tool.deserialize(tool.serialize());
			}
		}

		//call our superclass toolClicked function
		AEM.Toolbox.Widgets.StructuredMultiList.superclass.toolClicked.call(this, tool);
	},

	/**
	 * Override CQ.form.SmartImage commandToolClicked
	 * Will add some tracking code when the user clicks a tool.
	 */
	commandToolClicked: function (tool) {
		//if our tool is our rotate tool then track the click
		if (tool instanceof CQ.form.SmartImage.Tool.Rotate) {
			this.rotateActionPerformed = true;
		}

		//call our superclass commandToolClicked function
		AEM.Toolbox.Widgets.StructuredMultiList.superclass.commandToolClicked.call(this, tool);
	},

	/**
	 * Override CQ.form.SmartImage handleDrop
	 * Will clear values from our tool and track the user click
	 * so we know what value to store to the jcr.
	 */
	handleDrop: function (dragData) {
		//loop through our tools and reset them.
		var toolCnt = this.imageToolDefs.length;
		for (var toolIndex = 0; toolIndex < toolCnt; toolIndex++) {
			var tool = this.imageToolDefs[toolIndex];

			//if our tool is a image crop then clear our cropping info.
			if (tool instanceof CQ.form.ImageCrop) {
				tool.clearCroppingInformation();
				this.cropActionPerformed = true;
			}

			//if our tool is a image rotate tool then clear the image rotate values
			if (tool instanceof CQ.form.SmartImage.Tool.Rotate) {
				//clear any rotate information from our rotate tool.
				tool.deserialize('0');
				this.rotateActionPerformed = true;
			}
		}

		//call our superclass handleDrop function
		AEM.Toolbox.Widgets.StructuredMultiList.superclass.handleDrop.call(this, dragData);
	},

	/**
	 * Override CQ.form.SmartImage createProcessedImageConfig
	 * Will create our processed image configuration for displaying
	 * the cropped or rotated image in our view.
	 */
	createProcessedImageConfig: function (path) {
		//if we don't have a currently edited slide then return null
		if (!this.editedSlide) {
			return null;
		}

		//if our edited slide is not persisted or we didn't start with an image
		//then we don't have a processed image, return null
		if (!this.editedSlide.isPersistent || !this.editedSlide.startedWithImage) {
			return null;
		}

		//get our data path using our slide index.
		var basePath = this.fileReferencePrefix.replace("./", this.dataPath + "/");
		var slideDataPath = basePath.replace("$", this.editedSlide.slideIndex);

		//using our current path provider, generate the url to our slide image.
		var url = this.pathProvider.call(
			this, slideDataPath, this.requestSuffix, null, null, this);

		//if our data provider couldn't provide a url then just return null.
		if (url == null) {
			return null;
		}

		//return our process image config with the proper url.
		//add a random number to keep our image from being cached.
		return {
			"url": url + "?v=" + Math.floor(Math.random() * 100000001)
		};
	},

	/**
	 * Override CQ.form.Slideshow onBeforeSubmit method.
	 * Will handle some extra processing before submitting the dialog.
	 */
	onBeforeSubmit: function () {
		//save our changes
		this.saveChanges();

		//get any invalid slides we have
		var invalidSlide = this.getInvalidSlide();

		//if we have an invalid slide then show the slide, display a message,
		//and cancel the form submit.
		if (invalidSlide != null) {
			this.showSlide(invalidSlide);
			this.editedSlide = invalidSlide;
			this.buildComboBoxContent();

			CQ.Ext.Msg.show({
				title: CQ.I18n.getMessage('Validation Failed'),
				msg: CQ.I18n.getMessage('Verify the values of the marked fields.'),
				buttons: CQ.Ext.Msg.OK,
				icon: CQ.Ext.Msg.ERROR
			});

			return false;
		}

		//loop through our slides and set their sort order.
		//this will be used by server code for rendering our slides
		//in the correct order.
		var slideSortOrder = 0;
		for (var i = 0; i < this.slides.length; i++) {
			//get our current slide
			var slide = this.slides[i];

			//if our slide hasn't been deleted then set our sort order
			//and increment for the next slide
			if ((slide != undefined) && (!slide.isDeleted)) {
				slide.sortOrder = slideSortOrder;
				slideSortOrder++;
			}
		}

		//update our interface and allow submit to continue.
		//this will write out a variety of hidden fields will all our
		//slide values.
		this.removeOldInterface();
		this.createInterface(this.el);
		return true;
	},

	/**
	 * Override CQ.form.Slideshow addNeweSlide
	 * Will add a new slide to the ui.  This will make sure we haven't
	 * exceeded the maximum number of slides.
	 */
	addNewSlide: function () {
		//if we hit our max slides count then just return
		if (this.getSlideCount() >= this.maxSlides) {
			return;
		}

		//save the changes to our slide
		this.saveChanges();

		//get an index for our new slide
		var slideIndex = this.createSlideIndex();

		//create our new slide show it and set it as the currently edited slide.
		var slideCreated = this.createSlide(null, slideIndex, this.dataPath);
		this.showSlide(slideCreated);
		this.editedSlide = slideCreated;
	},

	/**
	 * Override CQ.form.Slideshow removeSlide
	 * Will remove a slide from our ui.  If no slides exist, a new empty
	 * slide will be created.
	 */
	removeSlide: function () {
		//only continue if we have a currently edited slide.
		if (this.editedSlide) {
			//set our slide to deleted
			this.editedSlide.isDeleted = true;

			//get a slide that surrounds this slide
			var surroundingSlide = this.getSurroundingSlide(this.editedSlide);

			//if we didn't find a surrounding slide then there are none left,
			//create a slide so our users can enter content.
			if (!surroundingSlide) {
				this.addNewSlide();
			} else {
				//our surrounding slide was found so use that.
				this.editedSlide = surroundingSlide;
				this.showSlide(this.editedSlide);
			}
		}
	},

	/**
	 * Override CQ.form.Slideshow createSlide
	 * Will create a new slide and prepopulate with data provided.  If no
	 * data was provided then an empty slide is created.
	 */
	createSlide: function (data, slideIndex, basePath) {
		//get our slide values from the data provided.
		var slideValues = {};

		for (var i = 0; i < this.settings.length; i++) {
			//get our item value
			var itemValue = (data ? data[this.settings[i].name] : null);
			if (itemValue == null && this.settings[i].defaultValue && !data) {
				itemValue = this.settings[i].defaultValue;
			}

			//set our value
			slideValues[this.settings[i].itemId] = itemValue;
		}
		var imageCrop = (data ? data["imageCrop"] : null);
		var imageRotate = (data ? data["imageRotate"] : null);
		var fileRef = (data ? data["fileReference"] : null);
		var sortOrder = (data ? data["SortOrder"] : null);

		//declare our slide variable
		var slide;

		//if data was provided then create a slide prepopulated.
		if (data) {
			var slideIndexNum = parseInt(slideIndex);
			if (slideIndexNum == NaN) {
				slideIndexNum = slideIndex;
			}
			var slideConfig = {
				"imageCrop": imageCrop,
				"imageRotate": imageRotate,
				"originalImageRotate": imageRotate,
				"slideIndex": slideIndexNum,
				"sortOrder": sortOrder,
				"isPersistent": true,
				"isDeleted": false,
				"isValid": true,
				"isModified": false,
				"items": this.settings,
				"maxwidth": this.maxwidth,
				"maxheight": this.maxheight,
				"hardwidth": this.hardwidth,
				"hardheight": this.hardheight,
				"defaultSlideName": this.defaultSlideName,
				"hideImage": this.hideImage,
				"itemResourceType": this.itemResourceType
			};

			//populate our custom settings
			for (var slideValue in slideValues) {
				slideConfig[slideValue] = slideValues[slideValue];
			}

			//if we have a file reference then try to get the file info and add to our slide
			if (fileRef) {
				var referencedFileInfo = this.resolveReference(fileRef, basePath);
				if (referencedFileInfo) {
					//fix url and fallback url
					referencedFileInfo.url = this.createRefUrl(referencedFileInfo);
					referencedFileInfo.fallbackUrl = this.createFallbackRefUrl(referencedFileInfo);

					slideConfig.referencedFileInfo = referencedFileInfo;
					slideConfig.startedWithImage = true;
				}
			}

			// add existing slide
			slide = new AEM.Toolbox.Widgets.StructuredMultiList.Slide(slideConfig);

			//add our slide to our array and return it.
			this.slides[sortOrder] = slide;
		} else {
			var slideConfig = {
				"referencedFileInfo": null,
				"imageCrop": null,
				"imageRotate": null,
				"originalImageRotate": 0,
				"slideIndex": slideIndex,
				"isPersistent": false,
				"isDeleted": false,
				"isValid": false,
				"isModified": false,
				"items": this.settings,
				"maxwidth": this.maxwidth,
				"maxheight": this.maxheight,
				"hardwidth": this.hardwidth,
				"hardheight": this.hardheight,
				"defaultSlideName": this.defaultSlideName,
				"itemResourceType": this.itemResourceType
			};

			//populate our custom settings
			for (var slideValue in slideValues) {
				slideConfig[slideValue] = slideValues[slideValue];
			}

			//no data provided, just create empty slide with default values.
			slide = new AEM.Toolbox.Widgets.StructuredMultiList.Slide(slideConfig);

			//add our slide to our array and return it.
			this.slides.push(slide);
		}
		return slide;
	},

	/**
	 * Override CQ.form.Slideshow saveChanges
	 * Will save the changes made on the currently edited slide.
	 * This will also set if the slide is valid for checking before the
	 * dialog is submitted.
	 */
	saveChanges: function () {
		//only continue if we have a currently edited slide.
		if (this.editedSlide) {
			//set our slide values from the slide settings panel.
			for (var i = 0; i < this.settings.length; i++) {
				//get our item value
				var itemValue = this.footPanel.getSettingValue(this.settings[i].itemId);

				//set our value
				this.editedSlide[this.settings[i].itemId] = (itemValue ? itemValue : null);
			}

			//if our user clicked the crop tool then they may have changed the value
			//find our crop tool and retrieve its value.
			if (this.cropActionPerformed) {
				var imageCrop = null;

				//loop through our tools and find our crop tool.
				var toolCnt = this.imageToolDefs.length;
				for (var toolIndex = 0; toolIndex < toolCnt; toolIndex++) {
					var tool = this.imageToolDefs[toolIndex];

					//if our tool is a image crop then set the image crop values
					if (tool instanceof CQ.form.ImageCrop) {
						imageCrop = tool.serialize();
					}
				}

				//set as modified if our value changed
				if (this.editedSlide.imageCrop != imageCrop) {
					this.editedSlide.isModified = true;
				}

				//set our image crop value.
				this.editedSlide.imageCrop = (imageCrop ? imageCrop : null);
			}

			//if our user clicked the rotate tool then the value may have changed
			//find our rotate tool and retrieve its value.
			if (this.rotateActionPerformed) {
				var imageRotate = null;

				//find our rotate setting and set it to our slide
				var toolCnt = this.imageToolDefs.length;
				for (var toolIndex = 0; toolIndex < toolCnt; toolIndex++) {
					var tool = this.imageToolDefs[toolIndex];

					//if our tool is a image rotate tool then set the image rotate values
					if (tool instanceof CQ.form.SmartImage.Tool.Rotate) {
						imageRotate = tool.serialize().toString();
					}
				}

				//set our image rotate value.
				this.editedSlide.imageRotate = (imageRotate ? imageRotate : null);
			}

			this.editedSlide.referencedFileInfo = this.referencedFileInfo;

			//set if this slide is valid.  We shouldn't submit our results until each slide is valid.
			this.editedSlide.isValid = this.footPanel.validate() && this.validate();
		}
	},

	/**
	 * Override CQ.form.Slideshow buildComboBoxContent to fix bug.
	 * Will build the combobox selections from our current slides.
	 */
	buildComboBoxContent: function () {
		//initialize arrays to hold our combobox objects and our display text counts.
		//each display text must be unique or we run into weird issues with the combobox.
		var data = [];
		var displayTextCounts = [];
		var slideCount = 0;

		//loop through each slide and create the combobox object.
		for (var i = 0; i < this.slides.length; i++) {
			//get the current slide
			var slide = this.slides[i];

			//if our slide hasn't been deleted then it should be shown in our combobox
			if ((slide != undefined) && (!slide.isDeleted)) {
				//get the display text for this slide
				var displayText = slide.createDisplayText();

				//look for this display text in our counts array
				var displayTextCount = 0;
				for (var j = 0; j < displayTextCounts.length; j++) {
					if (displayTextCounts[j].text == displayText) {
						displayTextCount = ++displayTextCounts[j].count;
					}
				}

				//if our slides display text count is greater than 0 then append it to our display text
				if (displayTextCount > 0) {
					displayText = displayText + ' [' + displayTextCount + ']';
				} else {
					//create a new entry
					displayTextCounts.push({text: displayText, count: 0});
				}

				//increment our slide count and prepend it (this is used to give the end user information about
				//what order the slide is currently at).
				slideCount++;
				displayText = slideCount + ' - ' + displayText;

				//add our combobox slide object
				data.push({
					"value": slide,
					"text": displayText
				});
			}
		}

		//initialize our combobox objects and select the currently edited slide.
		this.headPanel.setInitialComboBoxContent(data);
		this.headPanel.select(this.editedSlide);
	},

	/**
	 * Override CQ.form.Slideshow showSlide
	 * This will display the provided slide in the ui for editing.
	 */
	showSlide: function (slide) {
		//clear our tool flags
		this.cropActionPerformed = false;
		this.rotateActionPerformed = false;

		//load the slide details into the ui
		this.referencedFileInfo = slide.referencedFileInfo;

		//set our slide values from the slide settings panel.
		for (var i = 0; i < this.settings.length; i++) {
			//get our item value
			var itemValue = slide[this.settings[i].itemId];

			//set our value
			this.footPanel.setSettingValue(this.settings[i].itemId, itemValue);
		}

		//if we have a referenced image, then load that into the ui
		if (this.referencedFileInfo) {
			//create our original image from our referenced file info.  This will
			//be the original image loaded from the dam.
			this.originalRefImage = new CQ.form.SmartImage.Image(this.referencedFileInfo);

			//apply our load handler to populate our tools after the image is loaded.
			this.originalRefImage.loadHandler = function () {
				var toolCnt = this.imageToolDefs.length;
				for (var toolIndex = 0; toolIndex < toolCnt; toolIndex++) {
					var tool = this.imageToolDefs[toolIndex];

					//if our tool is a image crop then set the image crop values
					if (tool instanceof CQ.form.ImageCrop) {
						//clear any cropping information from our crop tool.
						tool.clearCroppingInformation();

						if (slide.imageCrop) {
							//set the crop tool with our slide details.
							tool.deserialize(slide.imageCrop);
						}
					}

					//if our tool is a image rotate tool then set the image rotate values
					if (tool instanceof CQ.form.SmartImage.Tool.Rotate) {
						//clear rotate value by setting it to 0
						tool.deserialize('0');

						//if we have an image rotate value then set our image rotation.
						if (slide.imageRotate) {
							//get integer values for our rotation.
							var intImageRotate = parseInt(slide.imageRotate);
							var intOriginalImageRotate = parseInt(slide.originalImageRotate);

							//if our slide was modified then we need to rotate the image
							//back to the correct orientation.  This will be rotating
							//the original image as we don't have a processed image to display.
							if (slide.isModified) {
								if (intImageRotate > 0) {
									this.getImagePanel().setRotation(intImageRotate);
								}
							} else {
								//set the rotate tool with our original rotate value.
								//this is so our rotation is relative to the original.
								tool.deserialize(slide.originalImageRotate);

								//our image has not been modified, but we should still get the
								//processed image back to the correct orientation.
								//determine our new rotate number
								var newRotate = intImageRotate + intOriginalImageRotate;

								//if we are at 90 or 270 degrees, then make sure our image doesn't get flipped.
								if (intOriginalImageRotate % 180 > 0) {
									newRotate += 180;
								}

								//make sure we get a value within 360
								newRotate %= 360;

								//if we need to rotate our image then do it
								if (newRotate > 0) {
									this.getImagePanel().setRotation(newRotate);
								}
							}
						}
					}
				}

				//update our view.
				this.updateView();
			}.createDelegate(this);

			//notify our smartimage of a new loaded image.
			this.notifyImageLoad(this.originalRefImage);

			//get our processed image config.  This will be the config for our processed
			//image (cropped, rotated, etc.).
			var processedImageConfig = null;
			if (!slide.isModified) {
				processedImageConfig =
					this.createProcessedImageConfig(this.referencedFileInfo.dataPath);
			}

			//if we have a processed image config, then create our processed image and
			//notify it was loaded.
			if (processedImageConfig) {
				this.processedRefImage =
					new CQ.form.SmartImage.Image(processedImageConfig);
				this.notifyImageLoad(this.processedRefImage);
			}

			//load our original image and processed image.
			this.originalRefImage.load();
			if (processedImageConfig) {
				this.processedRefImage.load();
			} else {
				//clear our processed image
				this.processedRefImage = null;
			}

			//update our view.
			this.updateView();
		} else {
			//clear our tools.
			var toolCnt = this.imageToolDefs.length;
			for (var toolIndex = 0; toolIndex < toolCnt; toolIndex++) {
				var tool = this.imageToolDefs[toolIndex];

				//if our tool is a image crop then clear the image crop values
				if (tool instanceof CQ.form.ImageCrop) {
					//clear any cropping information from our crop tool.
					tool.clearCroppingInformation();
				}

				//if our tool is a image rotate tool then clear the image rotate values
				if (tool instanceof CQ.form.SmartImage.Tool.Rotate) {
					//clear any rotate information from our rotate tool.
					tool.deserialize('0');
				}
			}

			//clear out our images and update our view.
			this.originalRefImage = null;
			this.processedRefImage = null;
			this.updateView();
		}
	},

	/**
	 * Override CQ.form.Slideshow onSlideChanged to fix bug
	 * This will save the current slide before switching, load the new slide
	 * into the ui, and rebuild the combobox values.
	 */
	onSlideChanged: function (slide) {
		//save the currently edited slide.
		this.saveChanges();

		//load the selected slide into the ui
		this.editedSlide = slide;
		if (this.editedSlide) {
			this.showSlide(this.editedSlide);
		}

		//rebuild the combobox
		this.buildComboBoxContent();

		//for some reason the combobox doesn't close after being rebuilt,
		//so for now just close it manually.
		this.headPanel.collapseSelect();
	},

	/**
	 * This will move a slide up one level.
	 */
	onUpButton: function () {
		//initialize our variables for holding the current slide and previous slide indexes
		var currentSlideIndex = -1;
		var prevSlideIndex = -1;

		//we need to reorder our slide so loop through our slides until we find our current one.
		for (var i = 0; i < this.slides.length; i++) {
			var slide = this.slides[i];

			//if our current slide is valid then set our previous slide index.
			if (!slide.isDeleted && this.editedSlide != slide) {
				prevSlideIndex = i;
			}

			//if we find our current slide then grab the index and break out of our loop
			if (this.editedSlide == slide) {
				currentSlideIndex = i;
				break;
			}
		}

		//if we were unable to grab our previous and current slide indexes, then return.
		if (currentSlideIndex < 0 || prevSlideIndex < 0) {
			return;
		}

		//get our previous slide
		var prevSlide = this.slides[prevSlideIndex];

		//swap our slides
		this.slides[prevSlideIndex] = slide;
		this.slides[currentSlideIndex] = prevSlide;

		//rebuild the combobox
		this.buildComboBoxContent();
	},

	/**
	 * This will move a slide down one level.
	 */
	onDownButton: function () {
		//initialize our variables for holding the current slide and previous slide indexes
		var currentSlideIndex = -1;
		var nextSlideIndex = -1;

		//we need to reorder our slide so loop through our slides until we find our current one.
		for (var i = this.slides.length - 1; i >= 0; i--) {
			var slide = this.slides[i];

			//if our current slide is valid then set our next slide index.
			if (!slide.isDeleted && this.editedSlide != slide) {
				nextSlideIndex = i;
			}

			//if we find our current slide then grab the index and break out of our loop
			if (this.editedSlide == slide) {
				currentSlideIndex = i;
				break;
			}
		}

		//if we were unable to grab our next and current slide indexes, then return.
		if (currentSlideIndex < 0 || nextSlideIndex < 0) {
			return;
		}

		//get our next slide
		var nextSlide = this.slides[nextSlideIndex];

		//swap our slides
		this.slides[nextSlideIndex] = slide;
		this.slides[currentSlideIndex] = nextSlide;

		//rebuild the combobox
		this.buildComboBoxContent();
	},

	/**
	 * Will get the first invalid slide found.
	 */
	getInvalidSlide: function () {
		//loop through each slide and look for one that isn't deleted and
		//is also invalid.
		var slideCnt = this.slides.length;
		for (var slideIndex = 0; slideIndex < slideCnt; slideIndex++) {
			var slide = this.slides[slideIndex];
			if ((slide != undefined) && (!slide.isDeleted) && !slide.isValid) {
				return slide;
			}
		}

		//unable to find invalid slide so return null
		return null;
	},

	/**
	 * Will get a slide that surrounds the slide passed in.
	 * This method will return the slide after the slide passed unless one doesn't exist.
	 * If a slide after the slide passed doesn't exist, then the slide before
	 * will be returned.  If no slide is found, then null will be returned.
	 */
	getSurroundingSlide: function (slide) {
		//initialize variable to hold our surrounding slide
		var surroundingSlide = null;

		//loop through each slide and find the slide around the slide passed in
		var slideCnt = this.slides.length;
		var slideFound = false;
		for (var slideIndex = 0; slideIndex < slideCnt; slideIndex++) {
			//get our current slide
			var currentSlide = this.slides[slideIndex];

			//if our current slide isn't deleted, isn't the slide provided,
			//and we haven't found our provided slide, then it may be the
			//slide we want to return
			if (!currentSlide.isDeleted && currentSlide != slide && !slideFound) {
				surroundingSlide = currentSlide;
			}

			//if this is the current slide then set our slide found
			if (currentSlide == slide) {
				slideFound = true;
			}

			//if the current slide was found then we are now looking for valid
			//slides after the slide passed in.  If this is the case, then we
			//only want to return the first valid slide found
			if (!currentSlide.isDeleted && currentSlide != slide && slideFound) {
				surroundingSlide = currentSlide;
				break;
			}
		}

		//return our surrounding slide
		return surroundingSlide;
	},

	/**
	 * Will get the number of slides that are valid
	 * and will be saved.
	 */
	getSlideCount: function () {
		var validSlideCount = 0;

		//loop through each slide and count the number that have not been deleted.
		var slideCnt = this.slides.length;
		for (var slideIndex = 0; slideIndex < slideCnt; slideIndex++) {
			var slide = this.slides[slideIndex];
			if ((slide != undefined) && (!slide.isDeleted)) {
				validSlideCount++;
			}
		}

		//return our valid slide count
		return validSlideCount;
	},

	/**
	 * Overwrite SmartFile validateValue so we can make sure the html5 validation is used.
	 * @param value
	 * @returns {*}
	 */
	validateValue: function (value) {
		return CQ.html5.form.SmartFile.superclass.validateValue.call(this, value);
	}
});

CQ.Ext.reg("structuredmultilist", AEM.Toolbox.Widgets.StructuredMultiList);