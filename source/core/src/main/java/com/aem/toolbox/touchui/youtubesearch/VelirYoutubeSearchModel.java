package com.aem.toolbox.touchui.youtubesearch;

import com.adobe.granite.ui.components.*;
import com.adobe.granite.xss.XSSAPI;
import com.day.cq.i18n.I18n;
import org.apache.commons.lang.StringUtils;
import org.apache.sling.api.resource.ValueMap;

import javax.servlet.http.HttpServletRequest;

/**
 * Created by jwu on 05/21/2018.
 */
public class VelirYoutubeSearchModel {

	private ComponentHelper cmp;

	private I18n i18n;

	private Config config;

	private Field field;

	private String attributes;
	private String inputAttributes;
	private String buttonAttributes;

	private HttpServletRequest request;

	public VelirYoutubeSearchModel(ComponentHelper cmp, I18n i18n, HttpServletRequest request) {

		this.cmp = cmp;

		this.i18n = i18n;

		this.request = request;

		config = cmp.getConfig();

		attributes = buildAttrs();

		inputAttributes = buildInputAttrs();

		buttonAttributes = buildButtonAttrs();
	}

	public String getAttributes() {
		return attributes;
	}

	public String getInputAttributes() {
		return inputAttributes;
	}

	public String getButtonAttributes() {
		return buttonAttributes;
	}

	private String buildAttrs() {

		Config cfg = cmp.getConfig();
		Tag tag = cmp.consumeTag();
		AttrBuilder attrs = tag.getAttrs();
		cmp.populateCommonAttrs(attrs);

		String youtubeUserID = getYoutubeUserID();
		String apiKey = getAPIKey();
		String playlistID = getPlaylistID();
		attrs.addClass("coral-YoutubeSearch");
		attrs.add("data-init", "youtubesearch");
		attrs.add("data-picker-title", i18n.getVar(cfg.get("pickerTitle", String.class)));
		attrs.add("data-picker-value-key", cfg.get("pickerValueKey", String.class));
		attrs.add("data-picker-id-key", cfg.get("pickerIdKey", String.class));
		attrs.add("data-youtube-user-id", youtubeUserID);
		attrs.add("data-api-key", apiKey);
		attrs.add("data-playlist-id", playlistID);

		if (cfg.get("disabled", false)) {
			attrs.add("data-disabled", true);
		}

		return attrs.build();
	}

	public String getYoutubeUserID() {
		return getConfig().get("youtubeUserID", String.class);
	}

	public String getAPIKey() {
		return getConfig().get("apiKey", String.class);
	}

	public String getPlaylistID() {
		return getConfig().get("playlistID", String.class);
	}

	private String buildInputAttrs() {

		ValueMap vm = (ValueMap) request.getAttribute(Field.class.getName());

		Boolean isRequired = getConfig().get("isRequired", Boolean.class);
		AttrBuilder inputAttrs = new AttrBuilder(request, getXssAPI());
		inputAttrs.addClass("coral-InputGroup-input");
		inputAttrs.addClass("js-coral-youtubesearch-input");
		inputAttrs.add("type", "text");
		inputAttrs.add("name", getConfig().get("name", String.class));
		inputAttrs.add("is", "coral-textfield");
		inputAttrs.add("aria-required", isRequired != null? isRequired:Boolean.FALSE);

		String validation = StringUtils.join(getConfig().get("validation", new String[0]), " ");
		inputAttrs.add("data-foundation-validation", validation);
		inputAttrs.add("data-validation", validation); // Compatibility

		inputAttrs.add("value", vm.get("value", String.class));

		if (getConfig().get("required", false)) {
			inputAttrs.add("aria-required", true);
		}

		return inputAttrs.build();
	}


	private String buildButtonAttrs(){

		AttrBuilder buttonAttrs = new AttrBuilder(request, getXssAPI());
		buttonAttrs.addClass("js-coral-youtubesearch-button");
		buttonAttrs.add("type", "button");
		buttonAttrs.add("title", i18n.get("Browse"));
		buttonAttrs.add("is", "coral-button");
		buttonAttrs.add("icon", getConfig().get("icon", "search"));
		buttonAttrs.add("iconsize", "S");

		if(getConfig().get("hideBrowseBtn", false)){
			buttonAttrs.add("hidden", "");
		}

		return  buttonAttrs.build();

	}

	private Tag getTag( ) {
		return this.cmp.consumeTag();
	}

	private Config getConfig() {
		return  this.cmp.getConfig();
	}

	private XSSAPI getXssAPI() {
		return this.cmp.getXss();
	}
}

