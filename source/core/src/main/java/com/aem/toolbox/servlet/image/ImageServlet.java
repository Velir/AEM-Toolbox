package com.aem.toolbox.servlet.image;

import java.awt.*;
import java.io.IOException;
import javax.jcr.RepositoryException;
import javax.servlet.http.HttpServletResponse;

import com.day.cq.commons.ImageHelper;
import com.day.cq.wcm.commons.AbstractImageServlet;
import com.day.cq.wcm.foundation.Image;
import com.day.image.Layer;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceUtil;
import org.osgi.service.component.ComponentContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * There are two main modes of operation for this image servlet:
 * 1. an image is requested with exact dimensions, and then the original is resized and cropped to meet those dimensions
 * 2. an image is requested to fit within a bounding box, and then the original is just scaled to within that bounding box, without changing its original aspect ratio
 *
 * There is also legacy support for resizing by aspect ratio. In that case the aspect ratio is converted to an ideal width/height,
 * and then the logic of option 1 above is used.
 *
 * consider removing device/size properties. These issues are probably better determined in CSS
 */

@SlingServlet(resourceTypes = {"sling/servlet/default"}, selectors = {"no.size.img", "crop.size.img", "bound.size.img", "size.img"})
@Properties(value = {
	@org.apache.felix.scr.annotations.Property(name = ImageServlet.PAGE_404, value = "", label = "Default 404 page", propertyPrivate = false),
	@org.apache.felix.scr.annotations.Property(name = ImageServlet.VALID_DEVICES,  cardinality = Integer.MAX_VALUE, value = {}, propertyPrivate = false, label = "Device selectors", description = "Specify the supported device selector like \"phone\", \"tablet\""),
	@org.apache.felix.scr.annotations.Property(name = ImageServlet.VALID_SIZES, cardinality = Integer.MAX_VALUE, value = {}, propertyPrivate = false,  label = "Size selectors", description = "Specify the sizes supported by the servlet. The format is WIDTHxHEIGHT")
})
public class ImageServlet extends AbstractImageServlet {
	private final static Logger LOG = LoggerFactory.getLogger(ImageServlet.class);

	protected static final String PAGE_404 = "default.page.404";
	protected static final String VALID_DEVICES = "valid.devices";
	protected static final String VALID_SIZES = "valid.sizes";

	private String pageNotFound;

	@SuppressWarnings("UnusedDeclaration")
	protected void activate(ComponentContext context) {
		pageNotFound = (String) context.getProperties().get(PAGE_404);
	}

	@Override
	protected void doGet(SlingHttpServletRequest req, SlingHttpServletResponse res) throws javax.servlet.ServletException, IOException {
		Resource r = req.getResource();

		//if our url isn't valid or we don't have a resource, return 404
		if (hasValidSelectors(req) && !ResourceUtil.isNonExistingResource(r)) {
			super.doGet(req, res);
		} else {
			res.setStatus(404);

			//if we have a 404 page configured then display that
			if (StringUtils.isNotEmpty(this.pageNotFound)) {
				req.getRequestDispatcher(this.pageNotFound).include(req, res);
			}
		}
	}

	private boolean hasValidSelectors(SlingHttpServletRequest req) {
		String propertyPrefix = getImageSizePrefix(req);
		// either it's a legacy request and anything goes, or valid dimensions are required
		return getImageSelector(req) == ImageSelector.SIZE
			|| getImageSelector(req) == ImageSelector.NO_SIZE
			|| ImageSizeProperty.isValid(propertyPrefix);
	}

	@Override
	protected Layer createLayer(ImageContext c)
		throws RepositoryException, IOException {
		// don't create the layer yet. handle everything later
		return null;
	}

	@Override
	protected void writeLayer(SlingHttpServletRequest req,
	                          SlingHttpServletResponse resp,
	                          ImageContext c, Layer layer)
		throws IOException, RepositoryException {

		Image image = new Image(c.resource);
		if (!image.hasContent()) {
			resp.sendError(HttpServletResponse.SC_NOT_FOUND);
			return;
		}

		// get style and set constraints
		image.loadStyleData(c.style);

		layer = image.getLayer(true, false, true);
		if (layer != null) {

			ImageDimensions currentDimensions = new ImageDimensions(new Dimension(layer.getWidth(), layer.getHeight()));
			String imageSizeString = getImageSizePrefix(req);
			ImageSelector imageSelector = getImageSelector(req);

			// segregate handling legacy requests into its own special method to keep the main logic pure and clean
			if (imageSelector == ImageSelector.SIZE) {
				handleLegacyRequest(layer, currentDimensions, imageSizeString);
			} else if (imageSelector != ImageSelector.NO_SIZE) {
				ImageSizeProperty imageSizeProperty = ImageSizeProperty.parse(imageSizeString);
				ImageDimensions idealDimensions = new ImageDimensions(imageSizeProperty.getDimension());
				ImageDimensions newDimensions;

				switch (imageSelector) {
					case CROP_SIZE:
						newDimensions = currentDimensions.resizeToOutsideDesiredDimensions(idealDimensions);
						layer.resize(newDimensions.getBase().width, newDimensions.getBase().height);
						layer.crop(newDimensions.getCrop(idealDimensions));
						break;
					case BOUND_SIZE:
						newDimensions = currentDimensions.resizeToInsideDesiredDimensions(idealDimensions);
						layer.resize(newDimensions.getBase().width, newDimensions.getBase().height);
					default:
						// we're good, leave image as-is
				}
			}
		}

		applyDiff(layer, c);

		setMimeTypeAndWriteNewLayer(resp, layer, image);
		resp.flushBuffer();
	}

	private void handleLegacyRequest(final Layer layer, final ImageDimensions currentDimensions, String imageSizeString) {
		ImageDimensions newDimensions;
		// see if we were passed in explicit sizing parameters
		if (ImageSizeProperty.isValid(imageSizeString)) {
			ImageSizeProperty imageSizeProperty = ImageSizeProperty.parse(imageSizeString);
			ImageDimensions idealDimensions = new ImageDimensions(imageSizeProperty.getDimension());

			// if we have a legacy aspect ratio, we want to scale the aspect ratio dimensions up to be an actual width/height
			if (imageSizeProperty.isLegacyAspectRatio()) {
				idealDimensions = idealDimensions.scaleToWidth((int) ImageDimensions.RWJF_MAGICAL_DEFAULT.getBase().getWidth());
			}

			// scale and crop
			newDimensions = currentDimensions.resizeToOutsideDesiredDimensions(idealDimensions);
			layer.resize(newDimensions.getBase().width, newDimensions.getBase().height);
			layer.crop(newDimensions.getCrop(idealDimensions));

		} else {
			// just scale with current aspect ratio to be within default bounding area
			newDimensions = currentDimensions.resizeToInsideDesiredDimensions(ImageDimensions.RWJF_MAGICAL_DEFAULT);
			layer.resize(newDimensions.getBase().width, newDimensions.getBase().height);
		}

	}

	private void setMimeTypeAndWriteNewLayer(SlingHttpServletResponse resp, Layer layer, Image image) throws RepositoryException, IOException {
		String mimeType = image.getMimeType();
		if (ImageHelper.getExtensionFromType(mimeType) == null) {
			// get default mime type
			mimeType = "image/png";
		}
		resp.setContentType(mimeType);
		double quality = mimeType.equals("image/gif") ? 255 : 1.0;
		layer.write(mimeType, quality, resp.getOutputStream());
	}


	private String getImageSizePrefix(SlingHttpServletRequest req) {
		String[] selectors = req.getRequestPathInfo().getSelectors();

		//get our property names holding the resizing configuration
		String propertyPrefix = selectors[selectors.length - 1];
		if (propertyPrefix == null || "img".equals(propertyPrefix)) {
			propertyPrefix = StringUtils.EMPTY;
		}
		return propertyPrefix;
	}

	private ImageSelector getImageSelector(SlingHttpServletRequest req) {
		String selectorString = req.getRequestPathInfo().getSelectorString();
		for (ImageSelector imageSelector : ImageSelector.values()) {
			if (StringUtils.startsWith(selectorString, imageSelector.getValue())) {
				return imageSelector;
			}
		}
		return null;
	}
}
