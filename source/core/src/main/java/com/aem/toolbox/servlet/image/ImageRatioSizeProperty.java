package com.aem.toolbox.servlet.image;


import java.awt.*;

import org.apache.commons.lang.StringUtils;

/**
 * ImageRatioSizeProperty -
 *
 * @author Kai Rasmussen
 */
public class ImageRatioSizeProperty extends ImageSizeProperty {
	private static final String REGEX = "(\\d+[_]{1}\\d+)";

	public static ImageRatioSizeProperty parse(String imageSize) {
		checkArgument(imageSize, REGEX);

		int parsedWidth = Integer.parseInt(StringUtils.substringBefore(imageSize, "_"));
		int parsedHeight = Integer.parseInt(StringUtils.substringAfter(imageSize, "_"));

		return new ImageRatioSizeProperty(new Dimension(parsedWidth, parsedHeight), imageSize);
	}

	public static boolean matchPattern(String imageSize) {
		return matchPattern(imageSize, REGEX);
	}

	private ImageRatioSizeProperty(Dimension dimension, String property) {
		super(dimension, property);
	}
}
