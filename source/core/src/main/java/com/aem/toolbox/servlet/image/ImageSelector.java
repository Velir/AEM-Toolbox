package com.aem.toolbox.servlet.image;

/**
 * ImageSelector -
 *
 * @author Sebastien Bernard
 * @version $Id$
 */
public enum ImageSelector {
	NO_SIZE("no.size.img"),
	CROP_SIZE("crop.size.img"),
	BOUND_SIZE("bound.size.img"),
	BOUND_WIDTH_SIZE("bound.width.size.img"),
	MAX_BOUND("max.size.img"),
	SIZE("size.img");

	private final String value;

	private ImageSelector(String value) {
		this.value = value;
	}

	public String getValue() {
		return value;
	}
}
