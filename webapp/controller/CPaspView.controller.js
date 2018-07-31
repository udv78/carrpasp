sap.ui.define([
		"carrpasp/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/routing/History",
		"carrpasp/model/formatter",
		"sap/m/Text",
		"sap/m/MessageBox"
	], function (
		BaseController,
		JSONModel,
		History,
		formatter,
		Text,
		MessageBox
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
						delay : 0,
						repairTblTitle : "Ремонты",
						crunTblTitle : "Пробеги",
						cjurTblTitle : "Юридическая история",
						coordTblTitle : "Местоположение"
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
			
			onDel : function (oEvent) {
				var path=this.getView().getBindingContext().getPath();
				MessageBox.show(
					this.getResourceBundle().getText("confirmDeleteText"), {
						icon: MessageBox.Icon.QUESTION,
						title: this.getResourceBundle().getText("confirmDeleteTitle"),
						actions: [MessageBox.Action.YES, MessageBox.Action.NO],
						onClose: function(sAnswer) {
							if (sAnswer === MessageBox.Action.YES) {
								this.getModel().remove(path);
								this.onNavBack();
							}
						}.bind(this)
					}
				);					
			},
			
			onUpd: function(oEvent) {
				this.getRouter().navTo("cpaspEdit", {
					objectId: this.Num
				});
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
				                               sorter : new sap.ui.model.Sorter("VAL_SEGMENT/NAME"),
					                           factory : function (sId, oContext) {   
				                var attr= new sap.m.ObjectAttribute("hl_"+sId,{title : "{VAL_SEGMENT/NAME}", text: "{VAL_SEGVAL/NAME}"});
				                return attr;
				}});  
				
				
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

				// Everything went fine.
				oViewModel.setProperty("/busy", false);
			}

		});

	}
);