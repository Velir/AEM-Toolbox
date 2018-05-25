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
				validate: validationFunc
			});
		},
	};

	ns.ValidatorUtils.registerValidator("ytsearch", ns.validators.ytsearchvalidate);

})(window.VelirValidators = window.VelirValidators || {}, jQuery, Granite);