sap.ui.define(["carrpasp/controller/BaseController",
	'jquery.sap.global', 
	'sap/ui/core/mvc/Controller'],
	function(BaseController, jQuery, Controller) {
	"use strict";

	var PageController = BaseController.extend("carrpasp.controller.Menu", {
		pressCarrpasp : function(evt) {
				this.getRouter().navTo("cpaspTbl");
		},
		pressSegment : function(evt) {
				this.getRouter().navTo("segmentTbl");
		},
		pressImport : function(evt) {
				this.getRouter().navTo("ImportFromFile");
		},
		formatCPaspTile: function(sCount) {
				
				var counter;
				this.getModel().read("/CPASP/$count", {
					async: true,
					success: function(oData, response) {
						
						counter = response.body;
						var content=this.getView().byId("cpasptile");
						content.setValue(counter);

					}.bind(this)
				});
				
				return "0";

			},
		formatSegmentTile: function(sCount) {
				
				var counter;
				this.getModel().read("/SEGMENT/$count", {
					async: true,
					success: function(oData, response) {
						
						counter = response.body;
						var content=this.getView().byId("csegmenttile");
						content.setValue(counter);

					}.bind(this)
				});
				
				return "0";

			}		
		
		
	});

	return PageController;
});