package com.aem.toolbox.servlet.image;


import java.awt.Dimension;
import java.awt.geom.Rectangle2D;

/**
 * Image -
 *
 * @author Sebastien Bernard
 * @version $Id$
 */
public class ImageDimensions {
	// for legacy purposes
	public static final ImageDimensions DEFAULT_IMAGE_DIMENSIONS = new ImageDimensions(new Dimension(220, 220));

	private Dimension base;

	public ImageDimensions(Dimension base) {
		if (base == null) {
			throw new NullPointerException("The base dimension cannot be null");
		}
		if (base.width == 0 || base.height == 0) {
			throw new IllegalArgumentException("neither width or height can be 0");
		}
		this.base = base;
	}
	public Dimension getBase() {
		return base;
	}

	public double getAspect() {
		return base.getHeight() / base.getWidth();
	}

	/**
	 * preserves original image aspect ratio
	 * @param other - ideal ImageDimensions
	 * @return ImageDimensions where one dimension matches other's, and the second is larger (or equal) compared to other's
	 */
	public ImageDimensions resizeToOutsideDesiredDimensions (ImageDimensions other) {
		Dimension newDimension = new Dimension();
		if (getAspect() < other.getAspect()) {
			newDimension.setSize(other.base.height * (1 / getAspect()), other.base.height);
		} else {
			newDimension.setSize(other.base.width, other.base.width * getAspect());
		}
		return new ImageDimensions(newDimension);
	}

	/**
	 * preserves original image aspect ratio
	 * @param other - ideal ImageDimensions
	 * @return ImageDimensions where one dimension matches other's, and the second is smaller (or equal) compared to other's
	 */
	public ImageDimensions resizeToInsideDesiredDimensions (ImageDimensions other) {
		Dimension newDimension = new Dimension();
		if (getAspect() < other.getAspect()) {
			newDimension.setSize(other.base.width, other.base.width * getAspect());
		} else {
			newDimension.setSize(other.base.height * (1 / getAspect()), other.base.height);
		}
		return new ImageDimensions(newDimension);
	}

	public ImageDimensions scaleToWidth (int width) {
		Dimension newDimension = new Dimension(width, (int) (width * getAspect()));
		return new ImageDimensions(newDimension);
	}

	/**
	 *
	 * @param other
	 * @return a "rectangle" of startx, starty, width, height
	 */
	public Rectangle2D getCrop (ImageDimensions other) {
		int cropWidth = base.width <= other.base.width ? 0 : base.width - other.base.width;
		int cropHeight = base.height <= other.base.height ? 0 : base.height - other.base.height;
		return new Rectangle2D.Double(cropWidth / 2, cropHeight / 2, other.base.width, other.base.height);
	}
}
