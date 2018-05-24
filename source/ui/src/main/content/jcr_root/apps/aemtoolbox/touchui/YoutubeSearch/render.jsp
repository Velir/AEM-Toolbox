<%@include file="/libs/granite/ui/global.jsp" %>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@page session="false" import="com.aem.toolbox.touchui.youtubesearch.VelirYoutubeSearchModel"%>
<c:set var="cmp" value="<%=cmp%>"/>
<c:set var="model" value="<%=new VelirYoutubeSearchModel(cmp, i18n, request)%>"/>

<span ${model.attributes}>
    <span class="coral-InputGroup coral-InputGroup--block">
        <input ${model.inputAttributes}>
        <span class="coral-InputGroup-button">
            <button ${model.buttonAttributes}></button>
        </span>
    </span>
</span>
