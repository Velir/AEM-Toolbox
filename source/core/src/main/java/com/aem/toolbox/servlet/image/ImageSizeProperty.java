package com.aem.toolbox.servlet.image;

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
	private static final String SINGLE_DIMENSION_REGEX = "(\\d+)";
	private static final Pattern PATTERN = Pattern.compile(REGEX);
	private static final Pattern SINGLE_WIDTH_DIMENSION_PATTERN= Pattern.compile(SINGLE_DIMENSION_REGEX);
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

	private static Matcher tryToMatchSingleWidthDimension(String input) {
		if (input == null) {
			return null;
		}
		Matcher matcher = SINGLE_WIDTH_DIMENSION_PATTERN.matcher(input);
		return matcher.matches() && ! matcher.group(1).equals("0") ? matcher : null;
	}

	public static boolean isValid(String input) {
		return tryToMatch(input) != null || tryToMatchSingleWidthDimension(input) != null;
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

	public static ImageSizeProperty parseSingleWidthDimension(String imageSize) {
		Matcher matcher = tryToMatchSingleWidthDimension(imageSize);
		if (matcher == null) {
			throw new IllegalArgumentException(String.format("The string %s doesn't match the pattern %s", "" + imageSize, SINGLE_WIDTH_DIMENSION_PATTERN));
		}

		int parsedWidth = Integer.parseInt(matcher.group(1));
		boolean legacyAspectRatio = false;
		int height = Integer.MAX_VALUE;

		return new ImageSizeProperty(new Dimension(parsedWidth, height), imageSize, legacyAspectRatio);
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
