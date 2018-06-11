# AEM Toolbox

## Description

This project aims to provide additional tools that can be used for developing applications on Adobe AEM.

## Prerequisites

* AEM 5.6.1 - The tools in this project have been confirmed on AEM 5.6.1.
  - NOTE: For CQ 5.5, please see the CQ5.5 release tag at  https://github.com/Velir/AEM-Toolbox/releases/tag/CQ5.5.

## Installation

* `mvn install` - builds package and installs on local CQ instance (http://localhost:4502)
* `mvn install -Daem.application.server=<custom host or ip> -Daem.application.port=<custom port> -Daem.admin.username=admin -Daem.admin.password=pass123` - builds package and installs on custom CQ instance

## Image Servlet Usage

The image servlet in this project provides some additional image resizing capabilities aimed to ease developing for responsive design.

Hard Width/Height Resizing:
Provides a way to serve images with exact height and width dimensions without images becoming distorted.  Images will first be scaled proportionally until its closes edge hits the target dimensions.  Then the extra fat will be cropped from the top/bottom or left/right of the image.

* Configure any smartimage widgets to use 'hardwidth' and/or 'hardheight' properties.
* Modify image url to use '.size.img' selectors. `http://<host>:<port>/content/<app>/en/.../image.size.img.jpg`

Max Width/Height Resizing:
Provides a way to serve images no larger than the configured dimensions.  Images are scaled proportionally.

* Configure any smartimage widgets to use 'maxwidth' and/or 'maxheight' properties.
* Modify image url to use '.size.img' selectors. `http://<host>:<port>/content/<app>/en/.../image.size.img.jpg`

Min Width/Height Resizing:
Provides a way to serve images no smaller than the configured dimensions.  Images are scaled proportionally.

* Configure any smartimage widgets to use 'minwidth' and/or 'minheight' properties.
* Modify image url to use '.size.img' selectors. `http://<host>:<port>/content/<app>/en/.../image.size.img.jpg`

Skip Image Resizing:
At times you may want to reuse an image configured by a content author, but skip the image resizing.  This can come in handy in an image gallery where the thumbnail is resized, but the larger image is not.

* Modify image url to use '.no.size.img' selectors. `http://<host>:<port>/content/<app>/en/.../image.no.size.img.jpg`

Multiple Configurations:
When dealing with responsive design, we need multiple image resizing configurations.  The provided image servlet does this by using custom configured suffixes at the end of the image url.  This provides the developer the option of creating any number of resizing configurations needed.

* Create an sling:OsgiConfig at `/apps/<app>/config/com.aem.toolbox.servlet.image.ImageServlet.xml` similar to the configuration below.  You will want to add your custom configurations to the valid.devices area.  By default the image servlet is configured with phone and tablet.

```
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root
	xmlns:sling="http://sling.apache.org/jcr/sling/1.0"
	xmlns:jcr="http://www.jcp.org/jcr/1.0"
	jcr:primaryType="sling:OsgiConfig"
	valid.devices="[phone,tablet]" />
```

* Configure any smartimage widgets to use device specific configurations. (ex. phonehardheight, phonehardwidth, phonemaxheight, phonemaxwidth, phoneminheight, phoneminwidth, tablethardheight, tablethardwidth, etc.)
* Modify image url to use device specific configuration '.size.img.phone'. `http://<host>:<port>/content/<app>/en/.../image.size.img.phone.jpg`.  Note: You will need to implement custom code for choosing the correct suffix for your image url.

## Widgets

This project comes with additional widgets for making content entry easier for content editors.

* Add the aem toolbox widgets clientlibrary to your page.  `<cq:includeClientLib categories="aem.toolbox.widgets.all"/>`.  Note:  You will only need to include this clientlibrary on pages served in author runmode.

## Structured Multi List Widget

This widget allows content authors to enter collections of data within a single dialog.  This widget extends smartimage in order to get its image capabilities.

* Configure your component dialog so it contains a widget of xtype 'structuredmultilist' at the dialog panel level.  This is the same location you would configure a 'smartimage' widget.
* hideImage:  If set to true the image area of this widget will be hidden so content authors can not configure images.
* maxSlides:  This allows you to limit the number of items a content author can add to the widget collection.
* fileReferencePrefix:  This allows you to specify a name for the nodes that get created under your component resource node. (ex. slide1, slide2, slide3, etc.)
* defaultSlideName:  Provides some default text for displaying in the header dropdown as new items are added to the collection.
* settings:  A cq:WidgetCollection that allows you to configure widgets for any additional data you need collected for each item.
* useForDisplay:  Can be added to any widget in the settings area to indicate that the value added to this widget should be used in the header dropdown.
* itemResourceType:  The sling:resourceType to assign to this slide when it is stored to the jcr. (Defaults to foundation/components/image)

```
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:jcr="http://www.jcp.org/jcr/1.0"
	jcr:primaryType="cq:Dialog"
	height="500"
	title="Carousel"
	xtype="dialog">
	<items jcr:primaryType="cq:TabPanel">
		<items jcr:primaryType="cq:WidgetCollection">
			<carouselslides
				jcr:primaryType="cq:Widget"
				ddGroups="media"
				requestSuffix=".img.png"
				title="Carousel Slides"
				hideImage="{Boolean}false"
				maxSlides="5"
				fileReferencePrefix="./slide$"
				defaultSlideName="New Slide"
				xtype="structuredmultilist">
				<settings jcr:primaryType="cq:WidgetCollection">
					<featuretext
						jcr:primaryType="cq:Widget"
						anchor="94%"
						allowBlank="{Boolean}false"
						fieldLabel="Feature Text"
						defaultValue="Featured"
						itemId="featureText"
						name="featureText"
						xtype="textfield"/>
					<title
						jcr:primaryType="cq:Widget"
						anchor="94%"
						allowBlank="{Boolean}false"
						fieldLabel="Title"
						itemId="title"
						name="jcr:title"
						useForDisplay="{Boolean}true"
						xtype="textfield"/>
					<summarytext
						jcr:primaryType="cq:Widget"
						anchor="94%"
						fieldLabel="Summary Text"
						itemId="summaryText"
						name="summaryText"
						xtype="textfield"/>
					<linktext
						jcr:primaryType="cq:Widget"
						anchor="94%"
						fieldLabel="Link Text"
						defaultValue="Read the study"
						itemId="linkText"
						name="linkText"
						xtype="textfield"/>
					<linklocation
						jcr:primaryType="cq:Widget"
						anchor="94%"
						emptyText="Start typing the name of a research page..."
						fieldLabel="Link Location"
						rootPath="/content/rwjf/en"
						itemId="linkLocation"
						name="linkLocation"
						xtype="autocompletefield"/>
				</settings>
				<cropConfig jcr:primaryType="nt:unstructured">
					<aspectRatios jcr:primaryType="cq:WidgetCollection">
						<aspect1
							jcr:primaryType="nt:unstructured"
							text="314 x 236"
							value="314,236"
							checked="true"/>
					</aspectRatios>
				</cropConfig>
			</carouselslides>
		</items>
	</items>
</jcr:root>
```

## YouTube Search Widget

Allows content authors to search a YouTube channel for embedding videos into a component.  This aims to eliminate the need for content authors to have to leave the AEM content editing experience for finding YouTube videos.

* Configure your component dialog so it contains a widget with xtype 'youtubesearch'.
* youtubeUser:  Allows us to configure a user for limiting what videos are searched against.
* apiKey: Youtube API Key
* playlistId: ID of the playlist to pull videos from. Default is the configured user's uploads playlist

```
<youtubevideo
	jcr:primaryType="cq:Widget"
	fieldLabel="Youtube Video"
	name="./videoId"
	youtubeUser=""
	apiKey=""
	playlistId=""
	xtype="youtubesearch"/>
```

## RTE Blockquote Plugin

Provides additional buttons in the RTE for wrapping content in a <blockquote/> tag.  This plugin contains two features 'blockquote' and 'linedblockquote'.

* Configure your RTE with the blockquote plugin and configure any features you want enabled.
* Add blockquote and linedblockquote css styles to the RTE and website pages.

```
<content
	jcr:primaryType="cq:Widget"
	externalStyleSheets="[/css/wysiwyg.css]"
	hideLabel="{Boolean}true"
	name="./content"
	title="Freeform Content"
	xtype="richtext">
	<rtePlugins
		jcr:primaryType="nt:unstructured">
		<blockquote
			jcr:primaryType="nt:unstructured"
			features="*"/>
	</rtePlugins>
</content>
```

Touch UI version of Blockquote Plugin:
```
<content
	jcr:primaryType="nt:unstructured"
		name="./richText"
		fieldLabel="Rich Text"
		useFixedInlineToolbar="true"
		externalStyleSheets="[/etc/designs/clientlibs/wysiwyg.css]"
		sling:resourceType="cq/gui/components/authoring/dialog/richtext">
	<rtePlugins
		jcr:primaryType="nt:unstructured">
			<blockquote 
				jcr:primaryType="nt:unstructured" 
				features="[blockquote,linedblockquote]"/>
	</rtePlugins>
	<uiSettings 
		jcr:primaryType="nt:unstructured"/>
		<cui jcr:primaryType="nt:unstructured">
			<inline jcr:primaryType="nt:unstructured" toolbar="[blockquote#blockquote,blockquote#linedblockquote]"/>
			<icons jcr:primaryType="nt:unstructured">
				<blockquote jcr:primaryType="nt:unstructured"
					command="blockquote#blockquote"
					icon="coral-Icon x-html-editor-tb x-edit-touchblockquote"/>
				<linedblockquote jcr:primaryType="nt:unstructured"
					command="blockquote#linedblockquote"
					icon="coral-Icon x-html-editor-tb x-edit-touchlinedblockquote"/>
			</icons>
		</cui>
	</uiSettings>
</content>
```

Blockquote HTML Structure:
```
<blockquote>
	<p>Blockquote Content</p>
</blockquote>
```

Lined Blockquote HTML Structure:
```
<blockquote>
	<p class="lined">Lined Blockquote Content</p>
</blockquote>
```

## RTE Formatting Plugin

Extends the AEM format plugin to allow specifying formats that will change both the wrapping tag and css class on that tag.

* Configure your RTE with the formatting plugin.
* formats:  A cq:WidgetCollection where you configure the different formats for this plugin.  You can specify the tag and classNames to be applied for each format.
* blacklist:  A cq:WidgetCollection where you configure what tags should be ignored by this plugin.  For example, we may not want this plugin to switch out the td tag of a table.
* Add any css styles needed for the formats configured.

```
<content
	jcr:primaryType="cq:Widget"
	externalStyleSheets="[/css/wysiwyg.css]"
	hideLabel="{Boolean}true"
	name="./content"
	title="Freeform Content"
	xtype="richtext">
	<rtePlugins
		jcr:primaryType="nt:unstructured">
		<formatting
			jcr:primaryType="nt:unstructured"
			features="*">
			<formats jcr:primaryType="cq:WidgetCollection">
				<h1
					jcr:primaryType="nt:unstructured"
					description="Heading 1"
					tag="h1"/>
				<h1articletitle
					jcr:primaryType="nt:unstructured"
					classNames="[article-title]"
					description="Heading 1 Article Title"
					tag="h1"/>
				<h1supertitle
					jcr:primaryType="nt:unstructured"
					classNames="[super-title]"
					description="Heading 1 Super Title"
					tag="h1"/>
				<h2
					jcr:primaryType="nt:unstructured"
					description="Heading 2"
					tag="h2"/>
				<h3
					jcr:primaryType="nt:unstructured"
					description="Heading 3"
					tag="h3"/>
				<p
					jcr:primaryType="nt:unstructured"
					description="Paragraph"
					tag="p"/>
			</formats>
			<blacklist jcr:primaryType="cq:WidgetCollection">
				<ul
					jcr:primaryType="nt:unstructured"
					tag="ul"/>
				<ol
					jcr:primaryType="nt:unstructured"
					tag="ol"/>
				<li
					jcr:primaryType="nt:unstructured"
					tag="li"/>
				<blockquote
					jcr:primaryType="nt:unstructured"
					tag="blockquote"/>
				<table
					jcr:primaryType="nt:unstructured"
					tag="table"/>
				<tbody
					jcr:primaryType="nt:unstructured"
					tag="tbody"/>
				<td
					jcr:primaryType="nt:unstructured"
					tag="td"/>
				<tfoot
					jcr:primaryType="nt:unstructured"
					tag="tfoot"/>
				<th
					jcr:primaryType="nt:unstructured"
					tag="th"/>
				<thead
					jcr:primaryType="nt:unstructured"
					tag="thead"/>
				<tr
					jcr:primaryType="nt:unstructured"
					tag="tr"/>
			</blacklist>
	</formatting>
	</rtePlugins>
</content>
```
