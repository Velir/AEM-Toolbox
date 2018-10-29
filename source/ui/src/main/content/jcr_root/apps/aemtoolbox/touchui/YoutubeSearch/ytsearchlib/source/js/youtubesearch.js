window.VelirTouchUI = window.VelirTouchUI || {};


(function($) {


    // Instance ID counter
    var youtubesearch_guid = 0;

    var CLASS_INPUT = 'js-coral-youtubesearch-input',
        CLASS_BUTTON = 'js-coral-youtubesearch-button',
        CLASS_DISABLED = 'is-disabled',
        CLASS_HIGHLIGHTED = 'is-highlighted',
        YOUTUBE_VIDEO_URL ='https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=%playlistID%&key=%apiKey%',
        HTML_PICKER_PANE_DEFAULT = [
            '<div class="coral-Youtubesearch-pickerPanel">',
            '</div>'
        ].join(''),
        HTML_PICKER = [
            '<div class="coral-Youtubesearch-picker coral-Modal" id="%ID%">',
            '<div class="coral-Modal-header">',
            '<h2 class="coral-Modal-title coral-Heading coral-Heading--2"></h2>',
            '<button type="button" class="js-coral-youtubesearch-confirm coral-Button coral-Button--square coral-Button--primary" title="Confirm">',
            '<i class="coral-Icon coral-Icon-sizeXS coral-Icon--check"></i>',
            '</button>',
            '<button type="button" class="js-coral-youtubesearch-cancel coral-Button coral-Button--square coral-Button" title="Cancel">',
            '<i class="coral-Icon coral-Icon-sizeXS coral-Icon--close"></i>',
            '</button>',
            '</div>',
            '<div class="coral-Modal-body"></div>',
            '</div>'
        ].join(''),
        HTML_WAIT = '<div class="coral-Wait coral-Wait--large coral-Wait--center"></div>';


    VelirTouchUI.YoutubeSearch = new Class(/** @lends VelirTouchUI.YoutubeSearch# */{
        toString: 'YoutubeSearch',
        extend: CUI.Widget,
        /**
         @extends CUI.Widget
         @classdesc A component for searching and selecting Youtube video from the specified channel.

         @description Creates a new Youtube Searcher
         @constructs

         @param {Object} options Component options
         @param {Mixed} options.element
         jQuery selector or DOM element to use for the pathbrowser element.
         @param {Array.<String>} [options.options=empty array]
         Array of available options (will be read from &lt;select&gt; by default).
         @param {String} [options.value=""]
         Initial value for the text input field.
         @param {Boolean} [options.showTitles=true]
         <code>false</code> to prevent showing option titles.
         @param {Number} [options.delay=200]
         Time in milliseconds on user input before starting search for autocomplete results.
         @param {String} [options.pickerTitle="Select Youtube Video"]
         Title of the {@link CUI.Modal} dialog in the picker modal.
         @param {String} [options.pickerValueKey="value"]
         Data attribute key to use for reading path values from picker CUI.ColumnView items.
         @param {String} [options.pickerIdKey="id"]
         Data attribute key to use for navigating to CUI.ColumnView items; ID is matched against path section tokens.
         */
        construct: function(options) {
            this.guid = youtubesearch_guid += 1;

            // Apply initial value
            if (this.options.value) {
                this.set('value', this.options.value);
            }

            // Adjust DOM to our needs
            this._render();

            // Picker
            this.$button = this.$element.find("." + CLASS_BUTTON);
            this.pickerEnabled = this.$button.length !== 0 && this.options.apiKey && this.options.playlistId;

            if (this.pickerEnabled) {
                this._constructPicker();
            }

            // Listen to property changes
            this.$element.on('change:value', this._handleValueChange.bind(this));
            this.$element.on('change:disabled', this._update.bind(this));

            if (this.pickerEnabled) {
                this.$button.on("click", this._clickedPickerButton.bind(this));
                this.$picker.on("beforehide", this._beforeHidePicker.bind(this));
                this.$picker.on(PICKER_EVENT_CONFIRM, this._pickerSelectionConfirmed.bind(this));
            }

            this.$element.on("blur", "." + CLASS_INPUT, function() {
                if (this.typeTimeout) {
                    clearTimeout(this.typeTimeout);
                }
                this.typeTimeout = null;
            }.bind(this));

            this.$element.on("keyup", "input", this._keyUp.bind(this));

        },

        defaults: {
            options: [],
            showTitles: true,
            delay: 200,
            autoPosition: true,
            pickerTitle: "Select Youtube Video",
            pickerValueKey: "value",
            pickerIdKey: "id",
        },

        inputElement: null,
        typeTimeout: null,
        triggeredBackspace: false,


        // Internals //

        /** @ignore */
        _render: function() {
            this._readDataFromMarkup();

            this.inputElement = this.$element.find("." + CLASS_INPUT);

            this.$element.removeClass(CLASS_HIGHLIGHTED);

            this._update();
        },

        /** @ignore */
        _readDataFromMarkup: function() {

            if (this.$element.attr("disabled") || this.$element.attr("data-disabled")) {
                this.options.disabled = true;
            }
        },
        /** @ignore */
        _handleValueChange: function(event) {
            if (this.options.value) {
                this._setInputValue(this.options.value);
            }
        },

        /** @ignore */
        _update: function() {

            if (this.options.disabled) {
                this.$element.addClass(CLASS_DISABLED);
                this.inputElement.add(this.$button).prop("disabled", true);
            }
            else {
                this.$element.removeClass(CLASS_DISABLED);
                this.inputElement.add(this.$button).prop("disabled", false);
            }
        },

        /** @ignore */
        _setInputValue: function(newValue, moveCursor) {
            // Using select text util to select starting from last character to last character
            // This way, the cursor is placed at the end of the input text element
            if (newValue != null) {
                this.inputElement.val(newValue);
                this.inputElement.change();
                //IE11 fix is.(":focus") triggers blur event. Replaced by this.inputElement == document.activeElement
                if (moveCursor && this.inputElement == document.activeElement) {
                    CUI.util.selectText(this.inputElement, newValue.length);
                }
            }
        },

        /** @ignore */
        _keyUp: function(event) {
            var key = event.keyCode;
            if (key === 8) {
                this.triggeredBackspace = false; // Release the key event
            }
        },


        /** @ignore */
        _constructPicker: function() {
            // Create the Picker .coral-Modal, if not already existing in markup
            var id = "yt-mod-guid-" + this.guid,
                idSel = "#" + id + ".coral-Modal",
                pickerOptions;

            this.$picker = $('body').find(idSel);

            if (this.$picker.length === 0) {
                $('body').append(HTML_PICKER.replace("%ID%", id));
                this.$picker = $('body').find(idSel);
            }

            pickerOptions = $.extend({}, this.options, {
                'element': this.$picker,
                'inputElement': $(this.options.element).find("input")
            });
            this.picker = new Picker(pickerOptions);

        },


        /** @ignore */
        _clickedPickerButton: function() {
            var self = this;
            var $wait;

            if (!self.options.disabled) {
                // The picker data hasn't loaded; display a loading indicator and disable button until resolution
                if (!self.picker.ytTable) {
                    self.$button.prop('disabled', true);
                    $wait = $(HTML_WAIT).appendTo('body');
                    self.picker.startup(self.inputElement.val()).always(function() {
                        self.$button.prop('disabled', false);
                        $wait.remove();
                    });
                }
                else {
                    self.picker.startup(self.inputElement.val());
                }
            }
        },

        /** @ignore */
        _beforeHidePicker: function() {
            this.pickerShown = false;
            this.inputElement.removeClass(CLASS_HIGHLIGHTED);
        },

        /** @ignore */
        _pickerSelectionConfirmed: function(event) {
            if (event.selectedValue) {
                this._setInputValue(event.selectedValue, true);
                this.inputElement.focus();
            }
        }
    });


    var PICKER_CLASS_CONFIRM = 'js-coral-youtubesearch-confirm',
        PICKER_CLASS_CANCEL = 'js-coral-youtubesearch-cancel',
        PICKER_CLASS_MODAL_BACKDROP = 'coral-youtubesearch-picker-backdrop',
        PICKER_CLASS_MODAL_TITLE = 'coral-Modal-title',
        PICKER_CLASS_MODAL_BODY = 'coral-Modal-body',
        PICKER_EVENT_SELECT = 'coral-youtubesearch-picker-select',
        PICKER_EVENT_CONFIRM = 'coral-youtubesearch-picker-confirm',

        PICKER_INVALID_KEY = 'invalid';

    var Picker = new Class(/** @lends Picker# */{
        toString: 'Picker',
        extend: CUI.Widget,

        // Public API //

        /**
         @extends CUI.Widget
         @classdesc Component that handles creation and interaction with the CUI.PathBrowser Picker UI.

         @constructs
         @param {Object} options
         */
        construct: function(options) {
            // Init CUI.Modal
            this.$element.modal({
                visible: false
            });
            this.modal = this.$element.data("modal");

            // Add class to manage layering above other modals (from which the picker may be launched)
            this.modal.backdrop.addClass(PICKER_CLASS_MODAL_BACKDROP);

            var $modalBody = this.$element.find('.' + PICKER_CLASS_MODAL_BODY);
            var $bodyContent = $(HTML_PICKER_PANE_DEFAULT);
            $modalBody.append($bodyContent);

            // Sets up internal selection data structure
            this._selection = [];

            // Find elements
            this.$cancel = this.$element.find('.' + PICKER_CLASS_CANCEL);
            this.$confirm = this.$element.find('.' + PICKER_CLASS_CONFIRM);

            //defind youtube video table
            this.$videoTable = new Coral.Table();

            // Event listening
            this._setupListeners();
        },

        _constructYTVideoTable: function() {
            var picker = this.options.element,
                pickerPannel = picker.find('.coral-Youtubesearch-pickerPanel'),
                self = this,
                videoURL = YOUTUBE_VIDEO_URL.replace("%apiKey%", self.options.apiKey).replace("%playlistID%", self.options.playlistId);
            table = this.$videoTable;

            //configure video table
            table.selectionMode = 'row';
            table.scrollHeight = 50;


            $.getJSON(videoURL, function (data) {


                //self._constructYTVideoTableHeader.call(self);
                self._constructYTVideoTableBody.call(self, data);

            });


            pickerPannel.append(table);
        },

        _constructYTVideoTableHeader: function () {

            var tableHead = new Coral.Table.Head(),
                headers = ['Video Image','Video Description'],
                self = this,
                table = self.$videoTable,
                tableHRow = new Coral.Table.Row();

            tableHead.sticky = true;
            headers.forEach(function(headerValue) {
                var headerCell = new Coral.Table.HeaderCell();
                headerCell.append(headerValue);
                tableHRow.append(headerCell);
            });
            tableHead.append(tableHRow);
            table.items._table.appendChild(tableHead);

        },

        _constructYTVideoTableBody: function (data) {

            var self = this,
                table = self.$videoTable,
                selectedVideoId = self.inputValue,
                videoItems = data.items;

            table.items.clear();

            videoItems.forEach(function (item) {
                var tableRow = new Coral.Table.Row(),
                    videoContent = item.snippet,
                    description = videoContent.description,
                    videoTitle = videoContent.title,
                    videoImgUrl = videoContent.thumbnails.default.url,
                    videoId = videoContent.resourceId.videoId,
                    imageTableCell = new Coral.Table.Cell(),
                    descriptionTableCell = new Coral.Table.Cell(),
                    IMAGE_HTML_ELEMENT= '<img class="yt-video-image" src="%url%" data-video-id="%videoId%"/>',
                    DESCRIPTION_HTML_ELEMENT= '<div class="yt-video-summary"><div class="yt-video-title">%videoTitle%</div><div class="yt-video-description">%videoDescription%</div></div>';


                description = description.length > 300 ? description.substring(0, 300) + "..." : description;

                imageTableCell.innerHTML = IMAGE_HTML_ELEMENT.replace("%url%", videoImgUrl).replace("%videoId%", videoId);
                tableRow.append(imageTableCell);

                descriptionTableCell.innerHTML = DESCRIPTION_HTML_ELEMENT.replace("%videoTitle%", videoTitle).replace("%videoDescription%", description);
                tableRow.append(descriptionTableCell);
                table.items.add(tableRow);
                if (selectedVideoId && selectedVideoId === videoId) {
                    tableRow.selected = true;
                }
            })

        },

        /**
         Begins a video-picking session.

         @param {String} input value
         The value in the input text field of Youtubesearch

         @returns {jQuery.Deferred} a promise that will be accepted when picker content has loaded,
         or rejected if the data fails to load.
         */
        startup: function(inputValue) {
            var deferred = $.Deferred(), cv,
                self = this,
                onDataLoaded = function() {
                    self._renderPicker();
                    self._showPicker();
                    self._constructYTVideoTable();
                };

            self.inputValue = inputValue;
            onDataLoaded();
            deferred.resolve();

            // Confirm action on Enter press if we have a valid selection.
            $(document).on('keypress.youtubesearch-confirm', function(event) {
                if (event.which === 13) { // Enter
                    // Just take down, if the cancel button has focus
                    if ($(':focus').is(this.$cancel)) {
                        this._takeDown();
                    }
                    else if (!this.$confirm.prop('disabled')) {
                        this._selectionConfirmed();
                    }
                }
            }.bind(this));

            return deferred.promise();
        },

        // Internals //


        /** @ignore */
        _showPicker: function() {
            this.modal.show();
        },

        /** @ignore */
        _hidePicker: function() {
            this.modal.hide();
        },

        /** @ignore */
        _takeDown: function() {
            $(document).off('keypress.youtubesearch-confirm');
            this._hidePicker();
        },

        /** @ignore */
        _setupListeners: function() {
            var self = this;

            self.$videoTable.on('coral-table:change', self._getSelectedVideo.bind(self));
            self.$cancel.on('click', self._takeDown.bind(self));
            self.$confirm.on('click', self._selectionConfirmed.bind(self));
            self.$element.on(PICKER_EVENT_SELECT, function(event) {
                var selection = (event.selectedValue) ? event.selectedValue : [];

                self._handleSelection.call(self, selection);
            });
        },

        _getSelectedVideo: function(event) {
            var selection = event.detail.selection;

            if (selection && $(selection).length > 0) {
                this._selection = $(selection)[0].$.find("img").data("videoId");
            }

        },

        /** @ignore */
        _itemSelected: function(event) {
            var selection = this._getSelectedValue(true);

            this.$element.trigger($.Event(PICKER_EVENT_SELECT, { "selectedValue": selection }));
        },

        /** @ignore */
        _enableConfirm: function (enable) {
            this.$confirm.prop('disabled', !enable);
        },

        /** @ignore */
        _updateConfirm: function () {
            var selection = this._getSelection();
            var hasSelection = (selection && selection.length > 0);
            this._enableConfirm(hasSelection);
        },

        /** @ignore */
        _setSelection: function(selection) {
            this._selection = selection;
        },

        /** @ignore */
        _getSelection: function() {
            var selection = this._selection;
            return selection;
        },

        /** @ignore */
        _handleSelection: function(selection) {
            this._setSelection(selection);
            this._updateConfirm();
        },

        /** @ignore */
        _selectionConfirmed: function() {
            var selection = this._getSelection();

            this.$element.trigger($.Event(PICKER_EVENT_CONFIRM, { "selectedValue": selection }));
            this._takeDown();
        },

        /** @ignore */
        _renderPicker: function() {
            this.$element.find('.' + PICKER_CLASS_MODAL_TITLE).text(this.options.pickerTitle);
        },

        /** @ignore */
        _resetPicker: function() {
            this.columnView.setSource(this.options.pickerSrc);
            this._updateConfirm();
        },

    });

    CUI.util.plugClass(VelirTouchUI.YoutubeSearch);

    // Data API
    if (CUI.options.dataAPI) {
        $(document).on("cui-contentloaded.data-api", function(e) {
            $("[data-init~='youtubesearch']", e.target).youtubeSearch();
        });
    }

}(window.jQuery));
