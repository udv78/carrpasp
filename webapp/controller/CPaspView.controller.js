sap.ui.define([
		"carrpasp/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/routing/History",
		"carrpasp/model/formatter",
		"sap/m/Text"
	], function (
		BaseController,
		JSONModel,
		History,
		formatter,
		Text
	) {
		"use strict";

		return BaseController.extend("carrpasp.controller.CPaspView", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit : function () {
				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data
				var iOriginalBusyDelay,
					oViewModel = new JSONModel({
						busy : true,
						delay : 0
					});

				this.getRouter().getRoute("cpaspView").attachPatternMatched(this._onObjectMatched, this);

				// Store original busy indicator delay, so it can be restored later on
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
				this.setModel(oViewModel, "cpaspView");
				this.getOwnerComponent().getModel().metadataLoaded().then(function () {
						// Restore original busy indicator delay for the object view
						oViewModel.setProperty("/delay", iOriginalBusyDelay);
					}
				);
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */


			/**
			 * Event handler  for navigating back.
			 * It there is a history entry we go one step back in the browser history
			 * If not, it will replace the current entry of the browser history with the worklist route.
			 * @public
			 */
			onNavBack : function() {
				var sPreviousHash = History.getInstance().getPreviousHash();

				if (sPreviousHash !== undefined) {
					history.go(-1);
				} else {
					this.getRouter().navTo("cpaspTbl", {}, true);
				}
			},

			/* =========================================================== */
			/* internal methods                                            */
			/* =========================================================== */

			/**
			 * Binds the view to the object path.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onObjectMatched : function (oEvent) {
				var sObjectId =  oEvent.getParameter("arguments").objectId;
				this.Num=sObjectId;
				if (this.getModel()) {
					this.getModel().metadataLoaded().then( function() {
						var sObjectPath = this.getModel().createKey("CPASP", {
							NUM :  sObjectId
						});
						this._bindView("/" + sObjectPath);
					}.bind(this));
				}
			},

			/**
			 * Binds the view to the object path.
			 * @function
			 * @param {string} sObjectPath path to the object to be bound
			 * @private
			 */
			_bindView : function (sObjectPath) {
				var oViewModel = this.getModel("cpaspView"),
					oDataModel = this.getModel();

				this.getView().bindElement({
					path: sObjectPath,
					events: {
						change: this._onBindingChange.bind(this),
						dataRequested: function () {
							oDataModel.metadataLoaded().then(function () {
								// Busy indicator on view should only be set if metadata is loaded,
								// otherwise there may be two busy indications next to each other on the
								// screen. This happens because route matched handler already calls '_bindView'
								// while metadata is loaded.
								oViewModel.setProperty("/busy", true);
							});
						},
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
				this._fillSegVals();
			},
			
			_fillSegVals : function() { 
				var header=this.getView().byId("cpaspSegValHeader");
				header.destroyAttributes();
				var ofilter= [new sap.ui.model.Filter("CPASPNUM","EQ",this.Num)];
				header.bindAggregation("attributes", {path: "/CPASPVAL",
				                               parameters: {
				                               		 expand: 'VAL_SEGMENT,VAL_SEGVAL'
				                               },
				                               filters : ofilter,
					                           factory : function (sId, oContext) {   
				                var attr= new sap.m.ObjectAttribute("hl_"+sId,{title : "{VAL_SEGMENT/NAME}", text: "{VAL_SEGVAL/NAME}"});
				                return attr;
				}});  
				
				
				//var vl=this.getView().byId("cpaspSegVals");
				/*var l=new Text("idText", {text: "Hello!!!"});
				vl.addContent(l);*/
				
				/*var oModel=this.getModel();
				oModel.read("/CPASPVAL", {
										filters : filter,
										success : function(oData) {
										  console.log("success");
										  console.log(oData);
										},
										error: function(oEvt) {
											console.log("error");
										}
									});		*/			

				
/*
				vl.bindAggregation("content", {path: "/CPASPVAL",
				                               parameters: {
				                               		 expand: 'VAL_SEGMENT,VAL_SEGCAL'
				                               },
				                               filters : ofilter,
					                           factory : function (sId, oContext) {   var oRevenue = oContext.getProperty("SEGID");
				                var segid=new sap.m.Text("segid_"+sId, {
				                    text: {
				                        path: "VAL_SEGMENT/NAME",
				                        type: new sap.ui.model.type.String()
				                    }
				                });
				                var segvalid=new sap.m.Text("segvalid_"+sId, {
				                    text: {
				                        path: "VAL_SEGCAL/NAME",
				                        type: new sap.ui.model.type.String()
				                    }
				                });
				                var hl= new sap.ui.layout.HorizontalLayout("hl_"+sId,{});
				                hl.addContent(segid);
				                hl.addContent(segvalid);
				                return hl;
				}});  
	*/			
			},

			_onBindingChange : function () {
				var oView = this.getView(),
					oViewModel = this.getModel("cpaspView"),
					oElementBinding = oView.getElementBinding();

				// No data for the binding
				if (!oElementBinding.getBoundContext()) {
					this.getRouter().getTargets().display("notFound");
					return;
				}

/*				var oResourceBundle = this.getResourceBundle(),
					oObject = oView.getBindingContext().getObject(),
					sObjectId = oObject.ID,
					sObjectName = oObject.CODE;
*/
				// Everything went fine.
				oViewModel.setProperty("/busy", false);
			}

		});

	}
);