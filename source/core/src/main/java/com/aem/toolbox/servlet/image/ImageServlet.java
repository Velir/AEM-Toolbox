package com.aem.toolbox.servlet.image;

import java.awt.*;
import java.awt.geom.Rectangle2D;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import javax.jcr.Property;
import javax.jcr.RepositoryException;
import javax.servlet.http.HttpServletResponse;

import com.day.cq.commons.ImageHelper;
import com.day.cq.commons.ImageResource;
import com.day.cq.wcm.commons.AbstractImageServlet;
import com.day.cq.wcm.foundation.Image;
import com.day.image.Layer;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.commons.osgi.OsgiUtil;
import org.osgi.service.component.ComponentContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SlingServlet(resourceTypes = {"sling/servlet/default"}, selectors = {"no.size.img", "size.img"})
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
	private Set<String> allowedSelectors = Collections.emptySet();
	private Map<String, ImageSizeProperty> allowedImageSizes = Collections.emptyMap();

	@SuppressWarnings("UnusedDeclaration")
	protected void activate(ComponentContext context) {
		pageNotFound = (String) context.getProperties().get(PAGE_404);
		allowedImageSizes = buildImageSizes(OsgiUtil.toStringArray(context.getProperties().get(VALID_SIZES)));

		String[] devices = (String[]) context.getProperties().get(VALID_DEVICES);
		Set<String> selectorSuffixes = new HashSet<String>();
		selectorSuffixes.addAll(Arrays.asList(devices));
		selectorSuffixes.addAll(allowedImageSizes.keySet());
		allowedSelectors = buildSelectors(selectorSuffixes);
	}

	private Map<String, ImageSizeProperty> buildImageSizes(String[] imageSizeStrings) {
		Map<String, ImageSizeProperty> imageSizes = new HashMap<String, ImageSizeProperty>(imageSizeStrings.length);
		try {
			for (String imageSize : imageSizeStrings) {
				ImageSizeProperty imageSizeProperty = ImageSizeProperty.parse(imageSize);
				imageSizes.put(imageSizeProperty.getProperty(), imageSizeProperty);
			}
		} catch (IllegalArgumentException e) {
			LOG.warn("Unable to parse imageSizes {}", imageSizes);
		}
		return imageSizes;
	}

	private Set<String> buildSelectors(Set<String> selectorSuffixes) {
		Set<String> selectors = new HashSet<String>();
		for (ImageSelector selector : ImageSelector.values()) {
			selectors.add(selector.getValue());
			for (String selectorSuffix : selectorSuffixes) {
				selectors.add(selector.getValue() + '.' + selectorSuffix);
			}
		}
		return selectors;
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
		String selectorString = req.getRequestPathInfo().getSelectorString();
		String propertyPrefix = getImageSizePrefix(req);
		return allowedSelectors.contains(selectorString) || ImageRatioSizeProperty.matchPattern(propertyPrefix);
	}

	@Override
	protected Layer createLayer(ImageContext c)
		throws RepositoryException, IOException {
		// don't create the layer yet. handle everything later
		return null;
	}


	/**
	 * {@inheritDoc}
	 * <p/>
	 * Override default ImageResource creation to support assets
	 */
	@Override
	protected ImageResource createImageResource(Resource resource) {
		return new Image(resource);
	}

	@Override
	protected void writeLayer(SlingHttpServletRequest req,
	                          SlingHttpServletResponse resp,
	                          ImageContext c, Layer layer)
		throws IOException, RepositoryException {

		ImageDimensions imgDim = buildImageDimension(req, c);

		Image image = new Image(c.resource);
		if (!image.hasContent()) {
			resp.sendError(HttpServletResponse.SC_NOT_FOUND);
			return;
		}

		// get style and set constraints
		image.loadStyleData(c.style);

		// get pure layer
		layer = image.getLayer(false, false, false);
		boolean modified = false;

		if (layer != null) {
			// crop
			modified = image.crop(layer) != null;

			// rotate
			modified |= image.rotate(layer) != null;

			//resize our layer to conform to max/min dimensions.
			if (hasToBeResize(req)) {
				Layer resizedLayer = resizeImage(layer, imgDim);

				//if we have a resized layer then set it and mark modified
				if (resizedLayer != null) {
					layer = resizedLayer;
					modified = true;
				}
			}

			// apply diff if needed (because we create the layer inline)
			modified |= applyDiff(layer, c);
		}

		if (modified) {
			setMimeTypeAndWriteNewLayer(resp, layer, image);
		} else {
			writeImage(resp, image);
		}
		resp.flushBuffer();
	}

	private Layer resizeImage(Layer layer, ImageDimensions imgDim) {
		Layer resizedLayer;//if a width or height is provided, then we just want to size on that and not use max/min
		if (imgDim.canBeRezised() || imgDim.isHasNewRatio()) {

			if(imgDim.isHasNewRatio()){
				resizedLayer = cropByRatio(layer, imgDim);
			} else if (imgDim.canBeCropped()) {
				//if both width and height were provided, then we need to do some cropping logic
				resizedLayer = cropImage(layer, imgDim);
			} else {
				//we only have a width or height configured so we can just scale proportionally on whichever one is configured.
				resizedLayer = resizeByHardDimensions(layer, imgDim);
			}
		} else {
			//we don't have a width or height so lets use any max/min values that were configured.
			resizedLayer = resizeByMinMax(layer, imgDim);
		}
		return resizedLayer;
	}

	private Layer resizeByHardDimensions(Layer layer, ImageDimensions imgDim) {
		return ImageHelper.resize(layer, imgDim.getBase(), new Dimension(), new Dimension());
	}

	private Layer resizeByMinMax(Layer layer, ImageDimensions imgDim) {
		return ImageHelper.resize(layer, new Dimension(), imgDim.getMin(), imgDim.getMax());
	}

	private Layer cropByRatio(Layer layer, ImageDimensions imgDim) {
		//If we are resizing to a ratio, resize first then crop
		Layer resizedLayer;ImageRatioSizeProperty ratioProperty = imgDim.getNewRatioDimension();
		Dimension ratio = ratioProperty.getDimension();
		Layer sizedLayer;
		if(imgDim.canBeRezised()){
			sizedLayer = resizeByHardDimensions(layer, imgDim);
		} else {
			//we don't have a width or height so lets use any max/min values that were configured.
			sizedLayer = resizeByMinMax(layer, imgDim);
		}

		//Calculate a new height based on the width
		int newHeight = (ratio.height * sizedLayer.getWidth()) / ratio.width;
		ImageDimensions sizedDimension = new ImageDimensions(new Dimension(sizedLayer.getWidth(), newHeight));
		sizedDimension.setNewRatioDimension(ratioProperty);

		//Crop based on new height
		return cropImage(sizedLayer, sizedDimension);
	}

	private Layer cropImage(Layer layer, ImageDimensions imgDim) {
		Layer resizedLayer;//get our image dimensions
		float imageWidth = layer.getWidth();
		float imageHeight = layer.getHeight();

		//determine our desired aspect and image aspect
		float desiredAspect = imgDim.getBaseAspectRatio();
		float imageAspect = imageWidth / imageHeight;

		//if we already have the same aspect, resize as is
		if (imageAspect == desiredAspect) {
			resizedLayer = resizeByHardDimensions(layer, imgDim);
		} else {
			//if our image aspect is less than the desired, size on width and crop by height
			if (imageAspect < desiredAspect) {
				//resize on width
				resizedLayer = ImageHelper.resize(layer, new Dimension(imgDim.getBase().width, 0), new Dimension(), new Dimension());

				//we need to make sure we have a layer to work with so if our resized layer is null, lets go back to our original layer
				if (resizedLayer == null) {
					resizedLayer = layer;
				}

				//determine how much to take off the top and bottom of the image
				int cropSize = (resizedLayer.getHeight() - imgDim.getBase().height) / 2;

				//crop our image
				resizedLayer.crop(new Rectangle2D.Double(0, cropSize, resizedLayer.getWidth(), resizedLayer.getHeight() - (cropSize * 2)));
			} else {
				//else lets size on height and crop by width
				resizedLayer = ImageHelper.resize(layer, new Dimension(0, imgDim.getBase().height), new Dimension(), new Dimension());

				//we need to make sure we have a layer to work with so if our resized layer is null, lets go back to our original layer
				if (resizedLayer == null) {
					resizedLayer = layer;
				}

				//determine how much to take off the left and right of the image
				int cropSize = (resizedLayer.getWidth() - imgDim.getBase().width) / 2;

				//crop our image
				resizedLayer.crop(new Rectangle2D.Double(cropSize, 0, resizedLayer.getWidth() - (cropSize * 2), resizedLayer.getHeight()));
			}
		}
		return resizedLayer;
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


	private void writeImage(SlingHttpServletResponse resp, Image image) throws RepositoryException, IOException {
		// do not re-encode layer, just spool
		Property data = image.getData();
		InputStream in = data.getBinary().getStream();
		resp.setContentLength((int) data.getLength());
		resp.setContentType(image.getMimeType());
		IOUtils.copy(in, resp.getOutputStream());
		in.close();
	}

	private ImageDimensions buildImageDimension(SlingHttpServletRequest req, ImageContext c) {
		String propertyPrefix = getImageSizePrefix(req);
		if (allowedImageSizes.containsKey(propertyPrefix)) {
			return buildImageDimensionFromAvailableSize(propertyPrefix);
		}

		return buildImageDimensionFromProperties(c, propertyPrefix);
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

	private ImageDimensions buildImageDimensionFromAvailableSize(String propertyPrefix) {
		ImageSizeProperty imageSizeProperty = allowedImageSizes.get(propertyPrefix);
		return new ImageDimensions(imageSizeProperty.getDimension());
	}

	private ImageDimensions buildImageDimensionFromProperties(ImageContext imageContext, String propertyPrefix) {
		ValueMap properties = imageContext.resource.adaptTo(ValueMap.class);

		//get our size properties from our resource
		int width = properties.get(propertyPrefix + "hardwidth", properties.get("hardwidth", 0));
		int height = properties.get(propertyPrefix + "hardheight", properties.get("hardheight", 0));
		int maxWidth = properties.get(propertyPrefix + "maxwidth", properties.get("maxwidth", 0));
		int maxHeight = properties.get(propertyPrefix + "maxheight", properties.get("maxheight", 0));
		int minWidth = properties.get(propertyPrefix + "minwidth", properties.get("minwidth", 0));
		int minHeight = properties.get(propertyPrefix + "minheight", properties.get("minheight", 0));

		ImageDimensions imageDim = new ImageDimensions(new Dimension(width, height));
		imageDim.setMax(maxWidth, maxHeight);
		imageDim.setMin(minWidth, minHeight);

		if(ImageRatioSizeProperty.matchPattern(propertyPrefix)){
			ImageRatioSizeProperty ratioDimensions = ImageRatioSizeProperty.parse(propertyPrefix);
			imageDim.setNewRatioDimension(ratioDimensions);
		}

		return imageDim;
	}

	private boolean hasToBeResize(SlingHttpServletRequest req) {
		//get whether or not we should apply sizing restrictions
		return StringUtils.startsWith(req.getRequestPathInfo().getSelectorString(), ImageSelector.SIZE.getValue());
	}
}
