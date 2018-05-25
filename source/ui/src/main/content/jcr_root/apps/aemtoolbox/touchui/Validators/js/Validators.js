(function(ns, $, Granite){
	ns.AdapterUtils = {
		defaultIsInvalid : function(el) {
			return function() {
				return el.attr("aria-invalid") === "true";
			};
		},
		defaultSetInvalid: function(el){
			return function(value) {
				el.attr("aria-invalid", "" + value).toggleClass("is-invalid", value);
			};
		},
		defaultIsDisabled: function(select){
			return select.attr("disabled");
		},
		defaultSetDisabled: function(select) {
			return function(disabled){
				select.prop("disabled", disabled);
				input.prop("disabled", disabled);
			};

		},
		registerAdapter: function(selector, registry){
			if(!registry){
				registry = $(window).adaptTo("foundation-registry");
			}
			registry.register("foundation.adapters",{
				type: "foundation-field",
				selector: "[data-validation='"+selector+"']",
				adapter: function(el) {
					var field = $(el);
					var select = field.children("select");
					return {
						isDisabled: ns.AdapterUtils.defaultIsDisabled(select),
						setDisabled: ns.AdapterUtils.defaultSetDisabled(field),
						isInvalid: ns.AdapterUtils.defaultIsInvalid(field),
						setInvalid: ns.AdapterUtils.defaultSetInvalid(field)
					};
				}
			});
		}
	};

	ns.ValidatorUtils = {
		validate : function(el){
			var api = el.adaptTo("foundation-validation");
			if(api){
				api.checkValidity();
				api.updateUI();
			}
		},

		registerValidator: function(selector, validationFunc){
			var registry = $(window).adaptTo("foundation-registry");
			ns.AdapterUtils.registerAdapter(selector, registry);
			registry.register("foundation.validation.validator", {
				selector: "[data-validation='"+selector+"']",
				validate: validationFunc,
				show: function(element, message) {
					var el = $(element);

					var field = el.closest(".coral-Form-field");

					var fieldAPI = el.adaptTo("foundation-field");
					if (fieldAPI && fieldAPI.setInvalid) {
						fieldAPI.setInvalid(true);
					}

					field.nextAll(".coral-Form-fieldinfo").addClass("u-coral-screenReaderOnly");

					var error = field.data("foundation-validation.internal.error");

					if (error) {
						var tooltip = $(error).data("foundation-validation.internal.error.tooltip");
						tooltip.content.innerHTML = message;

						if (!error.parentNode) {
							field.after(error, tooltip);
						}
					} else {
						error = new Coral.Icon();
						error.icon = "alert";
						error.classList.add("coral-Form-fielderror");

						tooltip = new Coral.Tooltip();
						tooltip.variant = "error";
						tooltip.placement = field.closest("form").hasClass("coral-Form--vertical") ? "left" : "bottom";
						tooltip.target = error;
						tooltip.content.innerHTML = message;

						$(error).data("foundation-validation.internal.error.tooltip", tooltip);

						field.data("foundation-validation.internal.error", error);
						field.after(error, tooltip);
					}
				},
				clear: function(element) {
					var el = $(element);

					var field = el.closest(".coral-Form-field");

					var fieldAPI = el.adaptTo("foundation-field");
					if (fieldAPI && fieldAPI.setInvalid) {
						fieldAPI.setInvalid(false);
					}

					var error = field.data("foundation-validation.internal.error");
					if (error) {
						var tooltip = $(error).data("foundation-validation.internal.error.tooltip");
						tooltip.hide();
						tooltip.remove();

						error.remove();
					}

					field.nextAll(".coral-Form-fieldinfo").removeClass("u-coral-screenReaderOnly");
				}
			});
		},
	};

	ns.ValidatorUtils.registerValidator("ytsearch", ns.validators.ytsearchvalidate);

})(window.VelirValidators = window.VelirValidators || {}, jQuery, Granite);