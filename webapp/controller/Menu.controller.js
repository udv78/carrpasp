sap.ui.define(["carrpasp/controller/BaseController",
	'jquery.sap.global', 
	'sap/ui/core/mvc/Controller'],
	function(BaseController, jQuery, Controller) {
	"use strict";

	var PageController = BaseController.extend("carrpasp.controller.Menu", {
		pressCarrpasp : function(evt) {
				this.getRouter().navTo("carrpasp");
		},
		pressSegment : function(evt) {
				this.getRouter().navTo("Segmentapp");
		}
		
	});

	return PageController;
});