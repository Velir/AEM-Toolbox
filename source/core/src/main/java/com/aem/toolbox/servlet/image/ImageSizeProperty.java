package com.aem.toolbox.servlet.image;

import java.awt.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * ImageSize -
 *
 * @author Sebastien Bernard
 * @version $Id$
 */
public class ImageSizeProperty {
	private static final String REGEX = "(\\d+)([x_])(\\d+)";
	private static final Pattern PATTERN = Pattern.compile(REGEX);
	private final Dimension dimension;
	private final String property;
	private final boolean legacyAspectRatio;

	private static Matcher tryToMatch(String input) {
		if (input == null) {
			return null;
		}
		Matcher matcher = PATTERN.matcher(input);
		return matcher.matches() && ! matcher.group(1).equals("0") && ! matcher.group(3).equals("0")
			? matcher : null;
	}

	public static boolean isValid(String input) {
		return tryToMatch(input) != null;
	}

	public static ImageSizeProperty parse(String imageSize) {
		Matcher matcher = tryToMatch(imageSize);
		if (matcher == null) {
			throw new IllegalArgumentException(String.format("The string %s doesn't match the pattern %s", "" + imageSize, REGEX));
		}

		int parsedWidth = Integer.parseInt(matcher.group(1));
		boolean legacyAspectRatio = matcher.group(2).equals("_");
		int parsedHeight = Integer.parseInt(matcher.group(3));

		return new ImageSizeProperty(new Dimension(parsedWidth, parsedHeight), imageSize, legacyAspectRatio);
	}

	protected ImageSizeProperty(Dimension dimension, String property, boolean legacyAspectRatio) {
		this.dimension = dimension;
		this.property = property;
		this.legacyAspectRatio = legacyAspectRatio;
	}


	public Dimension getDimension() {
		return dimension;
	}

	public String getProperty() {
		return property;
	}

	public boolean isLegacyAspectRatio() {
		return legacyAspectRatio;
	}
}
